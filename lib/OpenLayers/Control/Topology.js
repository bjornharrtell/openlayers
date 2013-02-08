/**
 * Class: OpenLayers.Control.Topology Control topology rule behaviours.
 */
OpenLayers.Control.Topology = OpenLayers.Class(OpenLayers.Control, {
    /**
     * Property: layer 
     * {<OpenLayers.Layer.Vector>} The layer to apply the rules to.
     */
    layer : null,

    /** 
     * Property: enforce 
     * {Boolean} If true the rule will be enforced on geometry operations.
     */
    enforce : true,

    /** 
     * Property: rules 
     * {Array} Rule classes that this control will handle.
     */
    rules : [],

    /** 
     * Property: ruleInstances 
     * {Array} Rule instances that this control will handle.
     */
    ruleInstances : [],

    /**
     * Constructor: OpenLayers.Control.Topology
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     * 
     * Valid options properties:
     * layer - {<OpenLayers.Layer.Vector>} The layer to apply the rules to.
     * rules - {Array} Rule classes that this control will handle.
     */
    initialize : function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);

        var i, ilen;

        for (i = 0, ilen = this.rules.length; i < ilen; i++) {
            var rule = this.rules[i];
            this.ruleInstances.push(new rule( {
                layer : this.layer
            }));
        }
    },

    /**
     * Method: setEnforce
     * Cause the rule to be enforced on geometry operations.
     * 
     * Parameters:
     * enforce - {Boolean} To enforce or not.
     */
    setEnforce : function(enforce) {
        var i, ilen;
        
        if (this.enforce === true && enforce === true) {
            return;
        }

        for (i = 0, ilen = this.ruleInstances.length; i < ilen; i++) {
            this.ruleInstances[i].setEnforce(enforce);
        }
        
        this.enforce = enforce;
    },

    /**
     * APIFunction: activate
     * Activates all topology rules and enforces them if enforce option is set to true.
     * 
     * Returns:
     * {Boolean}  True if the control was successfully activated or
     *            false if the control was already active.
     */
    activate : function() {
        var activated = OpenLayers.Control.prototype.activate.call(this);
        if (activated) {
            var i, ilen;

            for (i = 0, ilen = this.ruleInstances.length; i < ilen; i++) {
                this.ruleInstances[i].activate();
                if (this.enforce) {
                    this.ruleInstances[i].setEnforce(this.enforce);
                }
            }
        }
        return activated;
    },

    /**
     * APIFunction: deactivate
     * Deactivates all topology rules and stops the enforcement (if it's on)
     * 
     * Returns:
     * {Boolean} True if the control was effectively deactivated or false
     *           if the control was already inactive.
     */
    deactivate : function() {
        var deactivated = OpenLayers.Control.prototype.deactivate.call(this);
        if (deactivated) {
            var i, ilen;

            for (i = 0, ilen = this.ruleInstances.length; i < ilen; i++) {
                this.ruleInstances[i].deactivate();
                this.ruleInstances[i].setEnforce(false);
            }
        }
        return deactivated;
    },

    /**
     * Method: destroy
     * The destroy method is used to perform any clean up before the control
     * is dereferenced.
     */
    destroy : function() {
        OpenLayers.Control.prototype.destroy.call(this);

        var i, ilen;

        for (i = 0, ilen = this.ruleInstances.length; i < ilen; i++) {
            this.ruleInstances[i].destroy();
        }
    }

});