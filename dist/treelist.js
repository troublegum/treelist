/*!
 * TreeList.js v1.0
 *
 * https://github.com/troublegum/treelist
 */
function TreeList(config) {
    this._config = config == undefined ? {} : config;

    /**
     * Tree container selector
     */
    this.container = this._config.container;

    /**
     * View config contains HTML templates
     * 
     * Config:
     * {
     *    branch: "a branch HTML template"
     *    node: "a node HTML template"
     * }
     * 
     * The branch template placeholders:
     * - {nodes} - a place for list of nodes
     * 
     * The node template placeholders contains data from server. @see url property
     * 
     * The node template must contains HTML attributes:
     * - role="treeitem"
     * - data-id="{id}"
     * - data-is-leaf="{isLeaf}"
     */
    this.view = this._config.view;

    /**
     * Data url template
     * 
     * The url template placeholders:
     * - {nodeId} - a node id
     * 
     * JSON data structure required:
     * {
     *    "id": "node id" ,
     *    "isLeaf": "indicates what it is leaf (a node without children)",
     *    
     *    ...
     *    
     *    other yours properties
     * }
     */
    this.url = this._config.url;

    /**
     * Events config.
     * 
     * Example:
     * {
     *    ...
     *    
     *    on: {
     *       afterLoad: function() {alert("afterLoad")},
     *       ...
     *    }
     * }
     * 
     * Events:
     * - beforeLoad
     * - afterLoad
     * - error
     * - afterRender
     */
    this._on = this._config.on == undefined ? {} : this._config.on;
    var obj = this;

    /**
     * Initialization
     */
    this.init = function () {
        this._load();
        return this;
    };

    /**
     * Removes tree
     */
    this.remove = function () {
        $(this.container).empty();
        return this;
    }

    /**
     * Loads children for a current tree node
     */
    this._load = function (node) {
        if ($(node).data("dataLoaded") === true || this._event("beforeLoad", node) === false) {
            return;
        }
        var nodeId = node == undefined ? "" : $(node).data("id");
        var url = this._fillTemplate(this.url, {
            nodeId: nodeId
        });
        $.ajax({
            url: url,
            success: function (data) {
                obj._render(node, data);
            },
            dataType: "json"
        }).done(function () {
            $(node).data("dataLoaded", true);
        }).fail(function () {
            obj._event("error");
        }).always(function () {
            obj._event("afterLoad", node);
        });
    };

    /**
     * Fills template
     */
    this._fillTemplate = function (template, data) {
        for (var key in data) {
            template = template.replace("{" + key + "}", data[key]);
        }
        return template;
    };

    /**
     * Renders a branch of tree
     */
    this._render = function (node, data) {
        var target = node == undefined ? $(this.container) : node;
        var nodesHtml = "";
        $(data).each(function (index, nodeData) {
            var nodeHtml = obj._fillTemplate(obj.view.node, nodeData);
            nodesHtml += nodeHtml;
        });
        var branchHtml = this._fillTemplate(this.view.branch, {nodes: nodesHtml});
        $(target).append(branchHtml).find('[role="treeitem"]').click(function (e) {
            if ($(e.target).attr("role") == "treeitem") {
                var node = $(e.target);
            } else {
                var node = $(e.target).parents('[role="treeitem"]')[0];
            }
            if (obj._event("click", node) !== false) {
                if ($(node).data("isLeaf") == undefined || $(node).data("isLeaf") === false) {
                    obj._load(node);
                }
            }
            e.stopPropagation();
        });
        obj._event("afterRender", target);
    };

    /**
     * Sends a event
     */
    this._event = function (event, params) {
        var handler = this._on[event];
        if (handler != undefined) {
            return handler(params);
        }
    }
}
