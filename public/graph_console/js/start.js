'use strict';

//const vConsole = new VConsole();
//const remoteConsole = new RemoteConsole("http://[remote server]/logio-post");
//window.datgui = new dat.GUI();

const base_url = "";

var vue_options = {
    el: "#top",
    mixins: [mixins_bootstrap],
    store: vue_store,
    router: vue_router,
    data: {
        params: {
            method: "get",
        },
        responses: {},
        tenant_type: "microsoft",
        input_apikey: "",
    },
    computed: {
    },
    methods: {
        apikey_config_open: function(){
            this.input_apikey = this.apikey;
            this.dialog_open("#apikey_config_dialog");
        },
        apikey_config_save: function(){
            localStorage.setItem("graph_apikey", this.input_apikey);
            this.apikey = this.input_apikey;
            this.dialog_close("#apikey_config_dialog");
        },
        call_graph: async function(){
            try{
                this.progress_open();
                var input = {
                    url: base_url + "/graph-call",
                    body: {
                        param: this.params.param,
                        method: this.params.method,
                        tenant: this.tenant_type,
                    },
                    api_key: this.apikey
                };
                if( this.params.method != 'get' )
                    input.body.body = this.params.body;
                var result = await do_http(input);
                console.log(result);
                this.responses = result;
            }catch(error){
                console.error(error);
                alert(error);
            }finally{
                this.progress_close();
            }
        },
    },
    created: function(){
    },
    mounted: function(){
        proc_load();

        this.apikey = localStorage.getItem("graph_apikey");
    }
};
vue_add_data(vue_options, { progress_title: '' }); // for progress-dialog
vue_add_global_components(components_bootstrap);
vue_add_global_components(components_utils);

/* add additional components */
  
window.vue = new Vue( vue_options );
