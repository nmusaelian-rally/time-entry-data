Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function(){
        var userFilter = Ext.create('Rally.data.QueryFilter', {
            property: 'User',
            operator: '=',
            value: '/user/12361716944'  //nick@wsapi.com
        });
                            
        userFilter = userFilter.or({
                property: 'User',
                operator: '=',
                value: '/user/16630640459'  //nick2@wsapi.com
        });
        userFilter.toString();
                            
        var projectFilter = Ext.create('Rally.data.QueryFilter', {
                property: 'Project',
                operator: '=',
                value: '/project/12352608219'  //CompanyX
        });
                            
        projectFilter = projectFilter.or({
                property: 'Project',
                operator: '=',
                value: '/project/12352814790'  //Product1(Strategy)
        });
        projectFilter.toString();
        
        var millisecondsInDay = 86400000;
        var currentDate = new Date();
        var startDate = new Date(currentDate - millisecondsInDay*90); //in the last 90 days
        var startDateUTC = startDate.toISOString();
                            
        var dateFilter = Ext.create('Rally.data.QueryFilter', {
                property: 'Values.DateVal',
                operator: '>=',
                value: startDateUTC 
        });
        dateFilter.toString();
        
         Ext.create('Rally.data.WsapiDataStore', {
            model: 'TimeEntryItem',
            fetch: ['User','Project','Task','Values', 'UserName', 'Name'],
            pageSize: 100,
            autoLoad: true,
            filters: [userFilter, projectFilter, dateFilter],
            listeners: {
                load: this._onTimeEntryItemLoaded,
                scope: this
            }
        }); 
    },
    

    _onTimeEntryItemLoaded: function(store, data){
        console.log(data);
        var timeEntryItems = [];
                var pendingValues = data.length;
                
                Ext.Array.each(data, function(timeEntryItem) {
                            var t  = {
                                User: timeEntryItem.get('User')._refObjectName,
                                Project: timeEntryItem.get('Project')._refObjectName,
                                Task: (timeEntryItem.get('Task') && timeEntryItem.get('Task')._refObjectName || 'None'),
                                Values: []
                            };
                            
                            var values = timeEntryItem.getCollection('Values');
                            values.load({
                                fetch: ['Hours', 'DateVal'],
                                callback: function(records, operation, success){
                                    Ext.Array.each(records, function(value){
                                        t.Values.push({Hours: value.get('Hours'),
                                                        DateVal: value.get('DateVal')
                                                    });
                                    }, this);
                                    
                                    --pendingValues;
                                    if (pendingValues === 0) {
                                        this._createGrid(timeEntryItems);
                                    }
                                },
                                scope: this
                            });
                            timeEntryItems.push(t);
                }, this);
    } ,
    
     _createGrid: function(timeEntryItems) {
        var myStore = Ext.create('Rally.data.custom.Store', {
                data: timeEntryItems,
                groupField: 'User',
                pageSize: 100,  
            });
        if (!this.grid) {
        this.grid = this.add({
            xtype: 'rallygrid',
            itemId: 'mygrid',
            store: myStore,
            features: [{ftype:'grouping'}],
            columnCfgs: [
                {
                   text: 'User', dataIndex: 'User'
                },
                {
                    text: 'Project', dataIndex: 'Project'
                },
                {
                    text: 'Task', dataIndex: 'Task'
                },
                {
                    text: 'Values', dataIndex: 'Values', flex: 1, 
                    renderer: function(value) {
                        var html = [];
                        Ext.Array.each(value, function(v){
                            html.push('<b>Hours: </b>' + v.Hours + '<br /> ' + '<b>Date: </b>' + v.DateVal)
                        });
                        return html.join(', ');
                    }
                }
            ]
        });
         
         }else{
            this.grid.reconfigure(myStore);
         }
    },
    
});