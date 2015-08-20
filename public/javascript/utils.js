//JSONP get function that cleans up after itself
(function(base) {

    var JSONp = {};

    var scripts = {};

    var sym = 0;

    function removeScript(name) {
        var head = document.getElementsByTagName("head")[0];
        var script = scripts[name];
        if (script) head.removeChild(script);
        delete JSONp[name];
    }

    JSONp.get = function(url, data, options) {
        var callback_name = 'callback_' + (sym++);
        var on_success = options.onSuccess || function(){};
        var on_timeout = options.onTimeout || function(){};
        var timeout = options.timeout || 30; // sec

        data = data || {};
        data['callback'] = 'JSONp.' + callback_name;

        var query = [];
        for (var key in data) {
            query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
        }
        var src = url + '?' + query.join('&');

        var timeout_trigger = window.setTimeout(function(){
            removeScript(callback_name);
            on_timeout();
        }, timeout * 1000);

        JSONp[callback_name] = function(data){
            window.clearTimeout(timeout_trigger);
            removeScript(callback_name);
            on_success(data);
        };

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = src;

        document.getElementsByTagName('head')[0].appendChild(script);
    };

    base.JSONp = JSONp;
}(this || (typeof window !== 'undefined' ? window : global)))