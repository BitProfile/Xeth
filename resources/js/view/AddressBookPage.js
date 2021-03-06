var ContactView = Backbone.View.extend({

    initialize:function(options){
        _(this).bindAll("updateAlias", "updateAddress", "updateAvatar", "updateBitProfile", "editName", "removeLater", "cancelRemove", "goToSend", "updateBitProfileDetails");
        this.router = options.router;
        var data = {contact:this.model.toJSON()};
        this.$el = $(options.template(data));
        this.listenTo(this.model, "change:alias", this.updateAlias);
        this.listenTo(this.model, "change:address", this.updateAddress);
        this.listenTo(this.model, "change:avatar", this.updateAvatar);
        this.listenTo(this.model, "change:bitprofile", this.updateBitProfile);
        this.listenTo(this.model, "change:transactions", this.updateTransactions);
        this.updateBitProfile();
        
        this.name = this.$el.find('.name.editableTxt');

        this.name.editable({
            mode: 'inline',
            autotext: 'always',
            clear: false,
            validate: this.editName,
            display: false
        }).attr('title','edit alias');
        
        this.$el.tooltip({
            position: { my: "center bottom", at: "center top-5" },
            show: { duration: 200 },
            hide: { duration: 200 }
        });

        this.$el.find(".remove").click(this.removeLater);
        this.$el.find(".removing .cancel").click(this.cancelRemove);
        this.$el.find(".send").click(this.goToSend);
        
    },

    updateAlias:function(){
        var alias = this.model.get("alias");
        this.name.html(alias);
        this.name.editable("option", "value", alias);
    },

    updateAddress:function(){
        this.$el.find(".address").html(this.model.get("address"));
    },

    updateAvatar:function(){
        this.$el.find(".avatar img").attr("src", this.model.get("avatar"));
    },

    updateBitProfileDetails:function(){
        var details = this.bitprofile.get("details");
        var avatar = (details && details.avatar)? details.avatar: "img/avatarEmpty.png";
        this.$el.find(".avatar img").attr("src", avatar);
        this.model.set("avatar", avatar);
    },

    updateBitProfile:function(){
        var icon = this.$el.find(".bitprofileIcon");
        var bitprofile = this.model.get("bitprofile");

        if(this.bitprofile){
            this.stopListening(this.bitprofile);
            this.bitprofile.stopListening();
        }

        if(bitprofile){
            if(!icon.hasClass("on")) icon.addClass("on");
            icon.attr("title", bitprofile);
            this.bitprofile = new Profile({uri: bitprofile});
            this.listenTo(this.bitprofile, "change:details", this.updateBitProfileDetails);
            if(this.bitprofile.get("loaded"))
            {
                this.updateBitProfileDetails();
            }
        }else{
            icon.attr("title", "no bitprofile");
            icon.removeClass("on");
            this.bitprofile = null;
        }
    },

    updateTransactions:function(){
        this.$el.find(".transactions").html(this.model.get("transactions"));
    },

    editName:function(name){
        this.model.set({alias:name});
        this.model.save();
    },

    removeLater:function(){
        this.$el.addClass("removing");
        var counter = 5;
        var model = this.model;
        var $el = this.$el.find(".removing .time");
        $el.html(counter);
        var timer = this.timer = setInterval(function(){
            counter--;
            if(counter<0){
                clearInterval(timer);
                model.destroy();
            }else{
                $el.html(counter);
            }
        }, 1000);
    },

    cancelRemove:function(){
        if(this.timer) clearInterval(this.timer);
        this.$el.removeClass("removing");
    },

    goToSend: function(){
        this.router.redirect("send",{destination:{address:this.model.get("address"), bitprofile:this.model.get("bitprofile")}});
    }


});

function ContactViewFactory(template, router){
    this.create = function(model){return new ContactView({model:model, template:template, router:router})}
    return this;
}


var AddressBookPageView = SubPageView.extend({

    initialize:function(options){
        _(this).bindAll("open", "applyFilter");
        SubPageView.prototype.initialize.call(this,options);
        this.template = options.templates.get("addressbook");
        this.addressbook = options.addressbook;
        this.factory = new ContactViewFactory(options.templates.get("contact_item"), options.router);
    },
    
    render:function(){
        this.$el.html(this.template())
        this.collection = new CollectionView({
            collection: this.addressbook, 
            factory:this.factory,
            scroll:{scrollPage: this.$el.find(".scrollpage")/*, step: 71*/},
            el: this.$el.find(".contactList"), 
            empty:this.$el.find(".empty")
        });
        this.collection.render();
        this.$search = this.$el.find("#inputSearchContacts");
        this.$filter = this.$el.find("#filterContacts");
        this.$filter.selectmenu();
        this.$filter.on("selectmenuchange",this.applyFilter);
        this.$search.on("input",this.applyFilter);
        
        this.collection.collection.on("add", this.applyFilter);
        this.collection.collection.on("insert", this.applyFilter);
        this.applyFilter();
    },

    applyFilter:function(){
        var type = this.$filter.val();
        var searchVal = this.$search.val();
        var pattern = new RegExp(searchVal);
        var matchPattern = function(model){
            return pattern.test(model.get("alias"))||
            pattern.test(model.get("bitprofile"))||
            pattern.test(model.get("address"));
        };
        if(type=="all"){
            if(searchVal){
                this.collection.filter(matchPattern);
            }else{
                this.collection.filter(function(){return true;});
            }
        }
        else{
            var local = (type!="bitprofile");
            if(searchVal){
                this.collection.filter(function(model){return local == !model.get("bitprofile")&&matchPattern(model);});
            }else{
                this.collection.filter(function(model){return local == !model.get("bitprofile");});
            }
        }
    }


})
