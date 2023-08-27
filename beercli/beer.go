package beercli

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"

	"github.com/lithammer/fuzzysearch/fuzzy"
)

type Beer struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Tagline     string  `json:"tagline"`
	Description string  `json:"description"`
	ImageUrl    string  `json:"image_url"`
	Alcohol     float64 `json:"abv"`
}

func (b *Beer) Pretty() {
	fmt.Printf(`
--------------------Beer ID %v---------------------
	Name: 
		%v
	Tagline: 
		%v
	Description: 
		%v
	ImageUrl: 
		%v
	Alcohol: 
		%v
`,
		b.ID,
		b.Name,
		b.Tagline,
		b.Description,
		b.ImageUrl,
		b.Alcohol)
}

func ParseBeerRequest(url string) ([]byte, error) {

	resp, err := http.Get(url)
	if err != nil {
		log.Fatalln(err)
		return nil, err
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatalln(err)
		return nil, err
	}

	return body, err
}

func GetAllBeers() ([]Beer, error) {

	beerList := []Beer{}

	beerFull := []Beer{}

	for i := 1; i <= 13; i++ {
		url := fmt.Sprintf("https://api.punkapi.com/v2/beers?page=%v&per_page=%v", i, 25)

		body, err := ParseBeerRequest(url)
		if err != nil {
			log.Fatalln(err)
			return []Beer{}, err
		}

		if err := json.Unmarshal(body, &beerList); err != nil {
			log.Fatalln(err)
			return []Beer{}, err
		}

		beerFull = append(beerFull, beerList...)
	}

	return beerFull, nil
}

func GetBeerByID(id int) (Beer, error) {
	beer := []Beer{}

	beerstr := fmt.Sprintf("https://api.punkapi.com/v2/beers/%v", id)

	body, err := ParseBeerRequest(beerstr)
	if err != nil {
		//log.Fatalln(err)
		return Beer{}, err
	}

	//json.Unmarshal needs an []Beer{} instead of one object
	if err := json.Unmarshal(body, &beer); err != nil {
		//log.Fatalln(err)
		return Beer{}, err
	}

	//awkward but works
	beerByID := beer[0]

	return beerByID, nil
}

func GetRandomBeer() (Beer, error) {

	beerList := []Beer{}

	body, err := ParseBeerRequest("https://api.punkapi.com/v2/beers/random")
	if err != nil {
		//log.Fatalln(err)
		return Beer{}, err
	}

	if err := json.Unmarshal(body, &beerList); err != nil {
		//log.Fatalln(err)
		return Beer{}, err
	}

	beerRandom := beerList[0]

	if beerRandom.ImageUrl == "" {
		beerRandom.ImageUrl = "https://cdn-icons-png.flaticon.com/512/3362/3362651.png"
	}

	return beerRandom, nil
}

func SearchForBeer(keyword string) ([]Beer, error) {
	beerList, err := GetAllBeers()
	if err != nil {
		return nil, err
	}

	names := []string{}

	for _, b := range beerList {
		names = append(names, strings.ToLower(b.Name))
	}

	foundElements := fuzzy.RankFind(strings.ToLower(keyword), names)

	found := []Beer{}

	for _, elem := range foundElements {
		fmt.Println(elem.OriginalIndex, elem.Target)
		found = append(found, beerList[elem.OriginalIndex])
	}

	return found, nil
}
