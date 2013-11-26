define(["text", "can/view/ejs"], function(text) {
    var buildMap = {},
        escapeName = function(name){
            return name.replace(/\//g, "_")
        }
    return {
        load: function(name, req, onLoad, config) {
            text.load(name+".ejs", req, function(content){
                if (config.isBuild) {
                    buildMap[name] = content;
                    onLoad(content)
                } else {
                    require(["can/view/ejs"], function(can){
                        r = new can.view.ejs(escapeName(name), content)
                        onLoad(content)
                    })
                }
            }, config)
        },
        write: function(pluginName, moduleName, write){
            if(moduleName in buildMap){
                var content = text.jsEscape(buildMap[moduleName]),
                    name = escapeName(moduleName)
                write.asModule(pluginName + "!" + moduleName,
                   "define(function () { return can.view.ejs('" + name +"', '" + content + "');});\n")
            }
        }
    }
})
