/*global
 define
 */
/*jslint
 browser: true,
 white: true
 */
define([
    'jquery',
    'kb/service/client/NarrativeMethodStore',
    'kb/service/client/Catalog',
    'plugins/catalog/modules/widgets/kbaseViewSDKRegistrationLog',
    'kb/widget/legacy/authenticatedWidget',
    'bootstrap',
],
    function ($, NarrativeMethodStore, Catalog) {
        $.KBWidget({
            name: "KBaseCatalogRegistration",
            parent: "kbaseAuthenticatedWidget",  // todo: do we still need th
            options: {
                module_name:'null'
            },
            $mainPanel: null,
            $errorPanel: null,


            // clients to the catalog service and the NarrativeMethodStore
            catalog: null,
            nms: null,


            // main panel and elements
            $mainPanel: null,
            $loadingPanel: null,

            init: function (options) {
                this._super(options);
                
                var self = this;

                self.module_name = options.module_name;
                self.isGithub = false;

                // new style we have a runtime object that gives us everything in the options
                self.runtime = options.runtime;
                self.setupClients();

                console.log(options);

                // initialize and add the main panel
                self.$loadingPanel = self.initLoadingPanel();
                self.$elem.append(self.$loadingPanel);
                var mainPanelElements = self.initMainPanel();
                self.$mainPanel = mainPanelElements[0];
                self.$inputPanel = mainPanelElements[1];
                self.$registrationLogPanel = mainPanelElements[2];
                self.$errorPanel = mainPanelElements[3];
                self.$elem.append(self.$mainPanel);

                // nothing to fetch, just show some stuff
                self.render();
                self.hideLoading();

                return this;
            },

            render: function() {
                var self = this;

                var $registrationForm = $('<div>');

                var $gitUrlInput = $('<input type="text" class="form-control" id="git_url" placeholder="e.g. https://github.com/msneddon/kb_megahit">');
                var $commitInput = $('<input type="text" class="form-control" id="commit" placeholder="e.g. 15b6ec0">');

                var $git_url_group = 
                    $('<div>').addClass('form-group')
                        .append($('<label for="git_url">Module Git URL</label>'))
                        .append($gitUrlInput);
                $registrationForm.append($git_url_group);

                var $git_commit_group = 
                    $('<div>').addClass('form-group')
                        .append($('<label for="git_url">Commit (optional)</label>'))
                        .append($commitInput);
                $registrationForm.append($git_commit_group);

                var $warning = $('<span>').addClass('label label-warning');
                var $warningDiv = $('<div>').append($warning).append('<br><br>').hide();
                $registrationForm.append($warningDiv);

                var $registerBtn = $('<button>').addClass('btn btn-default').append('Register');

                $registerBtn.on('click', function() {
                    // make sure a git url is entered
                    var submitted_git_url = $gitUrlInput.val().trim();
                    if(!submitted_git_url) {
                        $git_url_group.addClass('has-error');
                        $warning.text("Please specify a git url.");
                        $warningDiv.show();
                        return;
                    }
                    // grab the hash
                    var submitted_git_hash = $commitInput.val().trim();

                    // clear any error state on input and disable buttons
                    $git_url_group.removeClass('has-error');
                    $warningDiv.hide();

                    $gitUrlInput.prop("disabled",true);
                    $commitInput.prop("disabled",true);
                    $registerBtn.hide();

                    // register the thing
                    self.register(submitted_git_url, submitted_git_hash)

                });

                $registrationForm.append($registerBtn);


                self.$inputPanel.append($registrationForm);
            },


            setupClients: function() {
                this.catalog = new Catalog(
                    this.runtime.getConfig('services.catalog.url'),
                    { token: this.runtime.service('session').getAuthToken() }
                );
                this.nms = new NarrativeMethodStore(
                    this.runtime.getConfig('services.narrative_method_store.url'),
                    { token: this.runtime.service('session').getAuthToken() }
                );
            },


            register: function(git_url, commit_hash) {
                var self = this;

                var params = {
                    git_url: git_url
                };
                if(commit_hash) {
                    params['git_commit_hash'] = commit_hash;
                }

                return self.catalog.register_repo(params)
                    .then(function (registration_id) {
                        console.log(registration_id);
                        var $logWidget = $('<div>')
                        self.logWidget = $logWidget["KBaseViewSDKRegistrationLog"]({
                            registration_id: registration_id,
                            runtime: self.runtime
                        });
                        self.$registrationLogPanel.append($logWidget).show();
                    })
                    .catch(function (err) {
                        self.showError(err);
                        console.error('ERROR');
                        console.error(err);
                    });
            },




            initMainPanel: function($appListPanel, $moduleListPanel) {
                var $mainPanel = $('<div>').addClass('kbcb-mod-main-panel');
                var $inputPanel = $('<div>');
                var $logPanel = $('<div>').hide();
                var $errorPanel = $('<div>').css('color','red').hide();
                $mainPanel
                    .append($inputPanel)
                    .append($logPanel)
                    .append($errorPanel);
                return [$mainPanel, $inputPanel, $logPanel, $errorPanel];
            },

            initLoadingPanel: function() {
                var $loadingPanel = $('<div>').addClass('kbcb-loading-panel-div');
                $loadingPanel.append($('<i>').addClass('fa fa-spinner fa-2x fa-spin'));
                return $loadingPanel;
            },

            showLoading: function() {
                var self = this;
                self.$loadingPanel.show();
                self.$mainPanel.hide();
            },
            hideLoading: function() {
                var self = this;
                self.$loadingPanel.hide();
                self.$mainPanel.show();
            },



            showError: function (error) {
                this.$errorPanel.empty();
                this.$errorPanel.append('<br>');
                this.$errorPanel.append('<strong>Error when attempting to register this repository.</strong><br><br>');
                this.$errorPanel.append(error.error.message);
                this.$errorPanel.append('<br>');
                this.$errorPanel.show();
            }
        });
    });



