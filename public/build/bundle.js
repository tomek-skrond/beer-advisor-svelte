
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function () {
    'use strict';

    function noop() { }
    // Adapted from https://github.com/then/is-promise/blob/master/index.js
    // Distributed under MIT License https://github.com/then/is-promise/blob/master/LICENSE
    function is_promise(value) {
        return !!value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }
    function attribute_to_object(attributes) {
        const result = {};
        for (const attribute of attributes) {
            result[attribute.name] = attribute.value;
        }
        return result;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    let SvelteElement;
    if (typeof HTMLElement === 'function') {
        SvelteElement = class extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
            }
            connectedCallback() {
                const { on_mount } = this.$$;
                this.$$.on_disconnect = on_mount.map(run).filter(is_function);
                // @ts-ignore todo: improve typings
                for (const key in this.$$.slotted) {
                    // @ts-ignore todo: improve typings
                    this.appendChild(this.$$.slotted[key]);
                }
            }
            attributeChangedCallback(attr, _oldValue, newValue) {
                this[attr] = newValue;
            }
            disconnectedCallback() {
                run_all(this.$$.on_disconnect);
            }
            $destroy() {
                destroy_component(this, 1);
                this.$destroy = noop;
            }
            $on(type, callback) {
                // TODO should this delegate to addEventListener?
                if (!is_function(callback)) {
                    return noop;
                }
                const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
                callbacks.push(callback);
                return () => {
                    const index = callbacks.indexOf(callback);
                    if (index !== -1)
                        callbacks.splice(index, 1);
                };
            }
            $set($$props) {
                if (this.$$set && !is_empty($$props)) {
                    this.$$.skip_bound = true;
                    this.$$set($$props);
                    this.$$.skip_bound = false;
                }
            }
        };
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }

    /* src/App.svelte generated by Svelte v3.59.2 */

    const file$3 = "src/App.svelte";

    function create_fragment$4(ctx) {
    	let div0;
    	let t1;
    	let div1;
    	let a0;
    	let t3;
    	let a1;
    	let t5;
    	let a2;
    	let t7;
    	let div3;
    	let div2;
    	let p0;
    	let t9;
    	let p1;
    	let t11;
    	let p2;
    	let t13;
    	let p3;
    	let t14;
    	let a3;
    	let t16;
    	let p4;
    	let t17;
    	let a4;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "🍺 Beer Advisor 🍺";
    			t1 = space();
    			div1 = element("div");
    			a0 = element("a");
    			a0.textContent = "Random Beer";
    			t3 = space();
    			a1 = element("a");
    			a1.textContent = "Search";
    			t5 = space();
    			a2 = element("a");
    			a2.textContent = "All Beers";
    			t7 = space();
    			div3 = element("div");
    			div2 = element("div");
    			p0 = element("p");
    			p0.textContent = "Thanks for visiting this website!";
    			t9 = space();
    			p1 = element("p");
    			p1.textContent = "Created By";
    			t11 = space();
    			p2 = element("p");
    			p2.textContent = "Tomasz Skrond";
    			t13 = space();
    			p3 = element("p");
    			t14 = text("Github: ");
    			a3 = element("a");
    			a3.textContent = "tomek-skrond";
    			t16 = space();
    			p4 = element("p");
    			t17 = text("Linkedin: ");
    			a4 = element("a");
    			a4.textContent = "/in";
    			this.c = noop;
    			attr_dev(div0, "class", "header");
    			add_location(div0, file$3, 4, 0, 53);
    			attr_dev(a0, "class", "tiles");
    			attr_dev(a0, "id", "beerimage");
    			attr_dev(a0, "href", "/randombeer");
    			add_location(a0, file$3, 10, 1, 133);
    			attr_dev(a1, "class", "tiles");
    			attr_dev(a1, "id", "searchimage");
    			attr_dev(a1, "href", "/search");
    			add_location(a1, file$3, 12, 1, 202);
    			attr_dev(a2, "class", "tiles");
    			attr_dev(a2, "id", "listimage");
    			attr_dev(a2, "href", "/allbeers/1");
    			add_location(a2, file$3, 14, 1, 264);
    			attr_dev(div1, "class", "flex-container");
    			add_location(div1, file$3, 8, 0, 102);
    			add_location(p0, file$3, 22, 2, 371);
    			set_style(p1, "font-size", "medium");
    			add_location(p1, file$3, 23, 2, 414);
    			set_style(p2, "font-size", "medium");
    			add_location(p2, file$3, 24, 2, 461);
    			attr_dev(a3, "href", "https://www.google.com");
    			add_location(a3, file$3, 25, 39, 548);
    			set_style(p3, "font-size", "small");
    			add_location(p3, file$3, 25, 2, 511);
    			attr_dev(a4, "href", "https://www.google.com");
    			add_location(a4, file$3, 26, 41, 643);
    			set_style(p4, "font-size", "small");
    			add_location(p4, file$3, 26, 2, 604);
    			add_location(div2, file$3, 21, 1, 363);
    			attr_dev(div3, "class", "footer");
    			add_location(div3, file$3, 20, 0, 341);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a0);
    			append_dev(div1, t3);
    			append_dev(div1, a1);
    			append_dev(div1, t5);
    			append_dev(div1, a2);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, p0);
    			append_dev(div2, t9);
    			append_dev(div2, p1);
    			append_dev(div2, t11);
    			append_dev(div2, p2);
    			append_dev(div2, t13);
    			append_dev(div2, p3);
    			append_dev(p3, t14);
    			append_dev(p3, a3);
    			append_dev(div2, t16);
    			append_dev(div2, p4);
    			append_dev(p4, t17);
    			append_dev(p4, a4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('my-app', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<my-app> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class App extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{box-sizing:border-box}.header{background-color:#885f21c4;text-align:center;font-size:35px;padding:40px}.flex-container{display:flex;justify-content:center;background-color:#f1f1f1;flex-direction:row;height:100%;width:100%}.footer>div{flex-direction:row;background-color:#885f21c4;text-align:center;padding:10px;height:100%;width:100%;align-self:flex-end}a.tiles{background-color:#4CAF50;border:solid black 10px;color:red;padding:15px 32px;text-align:center;text-decoration:none;display:inline-block;font-size:16px;font-weight:bolder;font-family:'Inconsolata', monospace;font-size:23px;width:30%;height:700px;margin:10px;opacity:0.6;border-radius:8px;transition:0.5s}#beerimage{background:#000 center/cover url("https://media.istockphoto.com/id/1142851443/vector/cartoon-beer-glass-icon-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=EsD32U2J6jve8V3MDYW_Nf95H7WH3a8NXshYvc9Y7aQ=") no-repeat}#searchimage{background:white center/cover url("https://images.emojiterra.com/openmoji/v13.1/512px/1f50e.png") no-repeat}#listimage{background:white center url("https://cdn-icons-png.flaticon.com/512/181/181627.png") no-repeat}a.tiles:active{filter:blur(4px);-webkit-filter:blur(4px);transition:0.2s}a.tiles:disabled{transition:0.2s}a.tiles:hover{font-size:larger;cursor:pointer;opacity:0.7}@media screen and (max-width: 600px){.flex-container{flex-direction:column;align-items:center}a.tiles{width:100%}}`;
    		this.shadowRoot.appendChild(style);

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$4,
    			create_fragment$4,
    			safe_not_equal,
    			{},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("my-app", App);

    /* src/Beer.svelte generated by Svelte v3.59.2 */

    const { console: console_1$1 } = globals;
    const file$2 = "src/Beer.svelte";

    // (12:4) {:catch error}
    function create_catch_block$2(ctx) {
    	let p;
    	let t_value = /*error*/ ctx[2].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "red");
    			add_location(p, file$2, 12, 4, 217);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*beer*/ 1 && t_value !== (t_value = /*error*/ ctx[2].message + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$2.name,
    		type: "catch",
    		source: "(12:4) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (10:4) {:then b}
    function create_then_block$2(ctx) {
    	let h4;
    	let t_value = /*b*/ ctx[1] + "";
    	let t;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			t = text(t_value);
    			add_location(h4, file$2, 10, 8, 181);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*beer*/ 1 && t_value !== (t_value = /*b*/ ctx[1] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$2.name,
    		type: "then",
    		source: "(10:4) {:then b}",
    		ctx
    	});

    	return block;
    }

    // (8:17)      <p>Loading...</p>     {:then b}
    function create_pending_block$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading...";
    			add_location(p, file$2, 8, 4, 141);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$2.name,
    		type: "pending",
    		source: "(8:17)      <p>Loading...</p>     {:then b}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let article;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2,
    		value: 1,
    		error: 2
    	};

    	handle_promise(promise = /*beer*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			article = element("article");
    			info.block.c();
    			this.c = noop;
    			add_location(article, file$2, 6, 0, 109);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			info.block.m(article, info.anchor = null);
    			info.mount = () => article;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*beer*/ 1 && promise !== (promise = /*beer*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('beer-component', slots, []);
    	let { beer } = $$props;
    	console.log(typeof beer);

    	$$self.$$.on_mount.push(function () {
    		if (beer === undefined && !('beer' in $$props || $$self.$$.bound[$$self.$$.props['beer']])) {
    			console_1$1.warn("<beer-component> was created without expected prop 'beer'");
    		}
    	});

    	const writable_props = ['beer'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<beer-component> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('beer' in $$props) $$invalidate(0, beer = $$props.beer);
    	};

    	$$self.$capture_state = () => ({ beer });

    	$$self.$inject_state = $$props => {
    		if ('beer' in $$props) $$invalidate(0, beer = $$props.beer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [beer];
    }

    class Beer extends SvelteElement {
    	constructor(options) {
    		super();

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{ beer: 0 },
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["beer"];
    	}

    	get beer() {
    		return this.$$.ctx[0];
    	}

    	set beer(beer) {
    		this.$$set({ beer });
    		flush();
    	}
    }

    customElements.define("beer-component", Beer);

    /* src/Beers.svelte generated by Svelte v3.59.2 */

    const { Error: Error_1$1, console: console_1 } = globals;
    const file$1 = "src/Beers.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (46:0) {:catch error}
    function create_catch_block$1(ctx) {
    	let p;
    	let t_value = /*error*/ ctx[7].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "red");
    			add_location(p, file$1, 46, 4, 1056);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(46:0) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (29:0) {:then beerList}
    function create_then_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*beerList*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*beerPromise*/ 1) {
    				each_value = /*beerList*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(29:0) {:then beerList}",
    		ctx
    	});

    	return block;
    }

    // (30:4) {#each beerList as b}
    function create_each_block(ctx) {
    	let div;
    	let h3;
    	let t0_value = /*b*/ ctx[4].name + "";
    	let t0;
    	let t1;
    	let p0;
    	let t2_value = /*b*/ ctx[4].tagline + "";
    	let t2;
    	let t3;
    	let p1;
    	let t4;
    	let b;
    	let t5_value = /*b*/ ctx[4].abv + "";
    	let t5;
    	let t6;
    	let t7;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			p0 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			t4 = text("Alcohol: ");
    			b = element("b");
    			t5 = text(t5_value);
    			t6 = text("%");
    			t7 = space();
    			add_location(h3, file$1, 39, 8, 897);
    			set_style(p0, "font-style", "italic");
    			add_location(p0, file$1, 40, 8, 923);
    			add_location(b, file$1, 41, 20, 989);
    			add_location(p1, file$1, 41, 8, 977);
    			set_style(div, "border", "5px dotted black");
    			set_style(div, "margin", "10px 10px 10px 10px");
    			set_style(div, "padding", "10px 10px 10px 10px");
    			set_style(div, "border-radius", "20px");
    			set_style(div, "text-align", "center");
    			set_style(div, "background-color", "beige");
    			add_location(div, file$1, 31, 4, 695);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(p0, t2);
    			append_dev(div, t3);
    			append_dev(div, p1);
    			append_dev(p1, t4);
    			append_dev(p1, b);
    			append_dev(b, t5);
    			append_dev(b, t6);
    			append_dev(div, t7);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(30:4) {#each beerList as b}",
    		ctx
    	});

    	return block;
    }

    // (27:20)      <p>Loading...</p> {:then beerList}
    function create_pending_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading...";
    			add_location(p, file$1, 27, 4, 629);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(27:20)      <p>Loading...</p> {:then beerList}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let await_block_anchor;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 3,
    		error: 7
    	};

    	handle_promise(/*beerPromise*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    			this.c = noop;
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('beers-component', slots, []);
    	let { pageNumber = 1 } = $$props;

    	async function loadBeers() {
    		const response = await fetch("http://localhost:4444/all");
    		var beerList = await response.json();
    		console.log(beerList[0]);

    		if (!response.ok) {
    			throw new Error("sth rong");
    		}

    		let beersubset = beerList.slice((pageNumber - 1) * 25, pageNumber * 25);
    		console.log(beersubset);
    		return beersubset;
    	}

    	const beerPromise = loadBeers();
    	const writable_props = ['pageNumber'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<beers-component> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('pageNumber' in $$props) $$invalidate(1, pageNumber = $$props.pageNumber);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Beer,
    		pageNumber,
    		loadBeers,
    		beerPromise
    	});

    	$$self.$inject_state = $$props => {
    		if ('pageNumber' in $$props) $$invalidate(1, pageNumber = $$props.pageNumber);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [beerPromise, pageNumber];
    }

    class Beers extends SvelteElement {
    	constructor(options) {
    		super();

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$2,
    			create_fragment$2,
    			safe_not_equal,
    			{ pageNumber: 1 },
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["pageNumber"];
    	}

    	get pageNumber() {
    		return this.$$.ctx[1];
    	}

    	set pageNumber(pageNumber) {
    		this.$$set({ pageNumber });
    		flush();
    	}
    }

    customElements.define("beers-component", Beers);

    /* src/AllBeers.svelte generated by Svelte v3.59.2 */

    function create_fragment$1(ctx) {
    	let beers_1;
    	let current;

    	beers_1 = new Beers({
    			props: { pageNumber: /*pagenum*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(beers_1.$$.fragment);
    			this.c = noop;
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(beers_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const beers_1_changes = {};
    			if (dirty & /*pagenum*/ 1) beers_1_changes.pageNumber = /*pagenum*/ ctx[0];
    			beers_1.$set(beers_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(beers_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(beers_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(beers_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('all-beers', slots, []);
    	let beers;
    	let beer;
    	let { pagenum = 1 } = $$props;
    	const writable_props = ['pagenum'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<all-beers> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('pagenum' in $$props) $$invalidate(0, pagenum = $$props.pagenum);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Beer,
    		Beers,
    		beers,
    		beer,
    		pagenum
    	});

    	$$self.$inject_state = $$props => {
    		if ('beers' in $$props) beers = $$props.beers;
    		if ('beer' in $$props) beer = $$props.beer;
    		if ('pagenum' in $$props) $$invalidate(0, pagenum = $$props.pagenum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [pagenum];
    }

    class AllBeers extends SvelteElement {
    	constructor(options) {
    		super();

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$1,
    			create_fragment$1,
    			safe_not_equal,
    			{ pagenum: 0 },
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["pagenum"];
    	}

    	get pagenum() {
    		return this.$$.ctx[0];
    	}

    	set pagenum(pagenum) {
    		this.$$set({ pagenum });
    		flush();
    	}
    }

    customElements.define("all-beers", AllBeers);

    /* src/RandomBeer.svelte generated by Svelte v3.59.2 */

    const { Error: Error_1 } = globals;
    const file = "src/RandomBeer.svelte";

    // (37:4) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t_value = /*error*/ ctx[2].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "red");
    			add_location(p, file, 37, 8, 943);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(37:4) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (24:4) {:then beer}
    function create_then_block(ctx) {
    	let div0;
    	let t0_value = /*beer*/ ctx[1].name + "";
    	let t0;
    	let t1;
    	let div3;
    	let div1;
    	let t2;
    	let div2;
    	let p0;
    	let t3;
    	let t4_value = /*beer*/ ctx[1].id + "";
    	let t4;
    	let t5;
    	let p1;
    	let t6;
    	let t7_value = /*beer*/ ctx[1].alcohol + "";
    	let t7;
    	let t8;
    	let p2;
    	let t9_value = /*beer*/ ctx[1].tagline + "";
    	let t9;
    	let t10;
    	let p3;
    	let t11_value = /*beer*/ ctx[1].description + "";
    	let t11;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div3 = element("div");
    			div1 = element("div");
    			t2 = space();
    			div2 = element("div");
    			p0 = element("p");
    			t3 = text("ID: ");
    			t4 = text(t4_value);
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Alcohol %vol: ");
    			t7 = text(t7_value);
    			t8 = space();
    			p2 = element("p");
    			t9 = text(t9_value);
    			t10 = space();
    			p3 = element("p");
    			t11 = text(t11_value);
    			attr_dev(div0, "class", "header");
    			add_location(div0, file, 24, 8, 502);
    			attr_dev(div1, "class", "bottle");
    			set_style(div1, "background-image", "url(" + /*beer*/ ctx[1].image_url + ")");
    			add_location(div1, file, 27, 12, 598);
    			add_location(p0, file, 29, 16, 728);
    			add_location(p1, file, 30, 16, 765);
    			add_location(p2, file, 31, 16, 817);
    			add_location(p3, file, 32, 16, 855);
    			attr_dev(div2, "class", "description");
    			add_location(div2, file, 28, 12, 686);
    			attr_dev(div3, "class", "flex-container");
    			add_location(div3, file, 26, 8, 557);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, p0);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(div2, t5);
    			append_dev(div2, p1);
    			append_dev(p1, t6);
    			append_dev(p1, t7);
    			append_dev(div2, t8);
    			append_dev(div2, p2);
    			append_dev(p2, t9);
    			append_dev(div2, t10);
    			append_dev(div2, p3);
    			append_dev(p3, t11);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(24:4) {:then beer}",
    		ctx
    	});

    	return block;
    }

    // (22:24)          <p>Loading...</p>     {:then beer}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading...";
    			add_location(p, file, 22, 8, 459);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(22:24)          <p>Loading...</p>     {:then beer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t0;
    	let div5;
    	let div0;
    	let p0;
    	let t2;
    	let div1;
    	let p1;
    	let t4;
    	let div2;
    	let p2;
    	let t6;
    	let div3;
    	let p3;
    	let t7;
    	let a0;
    	let t9;
    	let div4;
    	let p4;
    	let t10;
    	let a1;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 1,
    		error: 2
    	};

    	handle_promise(/*beerPromise*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			info.block.c();
    			t0 = space();
    			div5 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Thanks for visiting this website!";
    			t2 = space();
    			div1 = element("div");
    			p1 = element("p");
    			p1.textContent = "Created By";
    			t4 = space();
    			div2 = element("div");
    			p2 = element("p");
    			p2.textContent = "sampletext";
    			t6 = space();
    			div3 = element("div");
    			p3 = element("p");
    			t7 = text("Github: ");
    			a0 = element("a");
    			a0.textContent = "tomek-skrond";
    			t9 = space();
    			div4 = element("div");
    			p4 = element("p");
    			t10 = text("Linkedin: ");
    			a1 = element("a");
    			a1.textContent = "/in";
    			this.c = noop;
    			attr_dev(p0, "class", "bigger-footer");
    			add_location(p0, file, 42, 12, 1074);
    			attr_dev(div0, "class", "flex-container");
    			add_location(div0, file, 41, 8, 1033);
    			set_style(p1, "font-size", "medium");
    			add_location(p1, file, 45, 12, 1201);
    			attr_dev(div1, "class", "flex-container");
    			add_location(div1, file, 44, 8, 1160);
    			set_style(p2, "font-size", "medium");
    			add_location(p2, file, 48, 12, 1310);
    			attr_dev(div2, "class", "flex-container");
    			add_location(div2, file, 47, 8, 1269);
    			attr_dev(a0, "href", "https://www.google.com");
    			add_location(a0, file, 51, 49, 1456);
    			set_style(p3, "font-size", "small");
    			add_location(p3, file, 51, 12, 1419);
    			attr_dev(div3, "class", "flex-container");
    			add_location(div3, file, 50, 8, 1378);
    			attr_dev(a1, "href", "https://www.google.com");
    			add_location(a1, file, 54, 51, 1613);
    			set_style(p4, "font-size", "small");
    			add_location(p4, file, 54, 12, 1574);
    			attr_dev(div4, "class", "flex-container");
    			add_location(div4, file, 53, 8, 1533);
    			attr_dev(div5, "class", "footer");
    			add_location(div5, file, 40, 4, 1004);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => t0.parentNode;
    			info.anchor = t0;
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, p0);
    			append_dev(div5, t2);
    			append_dev(div5, div1);
    			append_dev(div1, p1);
    			append_dev(div5, t4);
    			append_dev(div5, div2);
    			append_dev(div2, p2);
    			append_dev(div5, t6);
    			append_dev(div5, div3);
    			append_dev(div3, p3);
    			append_dev(p3, t7);
    			append_dev(p3, a0);
    			append_dev(div5, t9);
    			append_dev(div5, div4);
    			append_dev(div4, p4);
    			append_dev(p4, t10);
    			append_dev(p4, a1);
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadBeers() {
    	const response = await fetch("http://localhost:4444/randombeer");
    	var beer = await response.json();

    	if (!response.ok) {
    		throw new Error("sth rong");
    	}

    	return beer;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('random-beer', slots, []);
    	const beerPromise = loadBeers();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<random-beer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ onMount, Beer, loadBeers, beerPromise });
    	return [beerPromise];
    }

    class RandomBeer extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{box-sizing:border-box}.header{background-color:#885f21c4;text-align:center;font-size:35px;padding:40px}.flex-container{display:flex;justify-content:space-between;background-color:#f1f1f1;flex-direction:row;height:600px;margin:5px 5px 5px 5px}.flex-container>p{height:20px;margin:0px 0px 0px 0px}.bigger-footer{height:50px}.footer>div{flex-direction:row;background-color:#885f21c4;text-align:center;align-items:center;justify-content:center;height:45px;width:100%;margin:0;align-self:flex-end}.bottle{width:30%;background-color:rgb(226, 199, 109);background-position:center;background-size:15vh;background-repeat:no-repeat;border:solid black 10px;border-radius:10px}.description{width:69%;border:dotted black 10px;border-radius:10px;padding:10px 10px 10px 10px;overflow:scroll}@media screen and (max-width: 600px){.flex-container{flex-direction:column;justify-content:center;height:1000px}.bottle{width:100%;height:60%}.description{width:100%;height:40%}}`;
    		this.shadowRoot.appendChild(style);

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance,
    			create_fragment,
    			safe_not_equal,
    			{},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("random-beer", RandomBeer);

})();
//# sourceMappingURL=bundle.js.map
