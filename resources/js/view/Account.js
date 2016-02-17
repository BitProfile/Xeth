var AccountView = Backbone.View.extend({
    initialize:function(options){
        _(this).bindAll("update");
        this.template = options.template;
    },
    render:function(){
        this.$el = $(this.template(this.model.toJSON()));
        this.$balance = this.$el.find(".amount");
        this.model.on("change:balance", this.update);
    },
    update:function(){
        var balance = this.model.get("balance");
        this.$balance.find(".int").html(parseInt(balance));
        this.$balance.find(".dec").html(parseDecimals(balance));
    }
});

var AccountSelectItemFactory = function(){

    var template = _.template($("#account_select_item_tpl").html());

    this.create = function(model){
        return new AccountView({model:model, template:template});
    }

    return this;
};


var AccountSelect = Backbone.View.extend({

    initialize:function(options){
        _(this).bindAll("toggle");
        this.template = _.template($("#account_select_tpl").html());
        this.collection = new CollectionView({factory:new AccountSelectItemFactory, collection:this.collection});
    },
    render:function(){
        this.$el.html(this.template());
        var header = this.$el.find(">div>a");
        var container =  this.$el.find("ul");
        this.collection.$el = container;
        this.header = header;
        header.click(this.toggle);
        this.collection.render();
        var select = this;
        this.collection.each(function(view){
            view.$el.find(">a").click(function(){
                var selected = container.find(".selected");
                header.children().appendTo(selected.find("a"));
                selected.removeClass("selected");
                $(this).parent().addClass("selected");
                $(this).children().appendTo(header);
                container.hide();
                select.active = view.model;
                select.trigger("change", select.active);
            });
        });
        this.collection.$el.find("li:first >a").click();
    },
    toggle:function(){
        this.collection.$el.toggle();
    },

    selected:function(){
        return this.active;
    }

});