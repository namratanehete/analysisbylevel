var manifestData;
var serverUrl;
var tableData = new Array();
var orgUnitData = new Object();
var dataElementGroupData = new Object();
var indicatorsData = new Object();
var orgUnitLevels = new Array();
var parentUserOrgId;
var displayOrgUnits = [];

$(document).ready(function() {
    loadManifest();
});

/**
 * Loads application manifest to scan for activities that map DHIS2 location
 * @returns {undefined}
 */
function loadManifest() {
    jQuery.getJSON('manifest.webapp').done(function(data) {
        manifestData = data;
        serverUrl = manifestData.activities.dhis.href;
        $('#btnExit').attr('href', serverUrl);
        getCurrentUser();
    }).fail(function(jqXHR, textStatus, errorThrown) {
        $.blockUI({message: 'Could not load manifest'});
    });
}

/**
 * Gets the current user to verify, if a user has logged in or not.
 * If user is logged in then loads organisationunits and dataelements metadata.
 * @returns {undefined} */
function getCurrentUser() {
    $.ajax({
        url: serverUrl + '/api/currentUser',
        headers: {
            'Accept': 'application/json'
        },
        type: "GET",
        cache: false,
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        }
    }).done(function(data, textStatus, jqXHR) {
        if (jqXHR.getResponseHeader('Login-Page') == 'true') {
            $.blockUI({message: $('#unauthenticatedMessage')});
        }
        else
        {
            loadDhisMetadata('indicators');
            loadDhisMetadata('organisationUnits');
            loadDhisMetadata('organisationUnitLevels');
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        $.blockUI({message: $('#failureMessage')});
    });
}

/**
 * loads DHIS metaData using DHIS WEB API
 * @param {string} metaDataType
 */
function loadDhisMetadata(metaDataType) {

    $.ajax({
        url: serverUrl + '/api/metaData?assumeTrue=false&' + metaDataType + '=true',
        headers: {
            'Accept': 'application/json'
        },
        type: "GET",
        cache: false,
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        }
    }).done(function(data, textStatus, jqXHR) {
        if (jqXHR.getResponseHeader('Login-Page') == 'true') {
            $.blockUI({message: $('#unauthenticatedMessage')});
        } else {
           setData(metaDataType,data);
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        $.blockUI({message: $('#failureMessage')});
    });
}

/**
 * sets metaData in instance variables
 * @param {string} metaDataType
 * @param {string} dataStr
 */
function setData(metaDataType,dataStr){
    if(metaDataType == 'organisationUnits')
    {
        orgUnitData = dataStr;
        showLevel1OrgUnit(null);
        console.log("orgUnitData = "+orgUnitData.organisationUnits.length);
    }
    else if(metaDataType == 'indicators')
    {
         indicatorsData = dataStr;
         setDataIndropdown(indicatorsData.indicators,metaDataType);
         console.log("indicators = "+indicatorsData.indicators.length);
    }
    else if(metaDataType == 'organisationUnitLevels')
    {
        orgUnitLevels = dataStr;
        console.log("indicators = "+orgUnitLevels.organisationUnitLevels.length);
    }
}

/**
 * shows Level 1 Org Unit in Table
 * @param {Object} ou
 */
function showLevel1OrgUnit(ou){
    displayOrgUnits = [];
    if(ou==null)
    {
        $.each(orgUnitData.organisationUnits, function(index, ou) {
            if (ou.parent== null) {
                console.log("Level 1 Ou = "+ou.name);
                parentUserOrgId = ou.id;
                displayOrgUnits.push(ou);
            }
        });
    }
    else
        displayOrgUnits.push(ou);
}

/**
 * Search Child organisation units by passing Parent Uid.
 * @param {String} parentUid
 */
function searchOrgUnitByParent(parentUid){
    
    displayOrgUnits = [];
    
    if(parentUid != null)
    {
        $.each(orgUnitData.organisationUnits, function(index, ou) {
            if(ou.parent != null)
            {
                if (ou.parent.id == parentUid) {
                    displayOrgUnits.push(ou);
                }
            }
        });

    }
    sortJson(displayOrgUnits,'name');
}

function sortJson(data,prop){
    return data.sort(function(a, b) {
        var x = a[prop]; var y = b[prop];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

/**
 * 
 * Get parent organisation unit by passing Id.
 * @param {String} uid
 */
function getParentOrgUnitById(uid){
    
    var parentOu; 
    
    $.each(orgUnitData.organisationUnits, function(index, ou) {
        if (ou.id == uid) {
            if(ou.parent != null)
            {
                console.log("Returning parent ou as "+ou.parent.name);
                parentOu = ou.parent;
            }
            return false;
        }
    });
    
    return parentOu;
}

function goDown(uid){
    
    searchOrgUnitByParent(uid);
    showTable();
}

function goUp(uid){
    
    var parentOU = getParentOrgUnitById(uid);
    var ou;
    
    if(parentOU != null)
    {
        if(parentUserOrgId != null)
        {
            if(parentOU.id != parentUserOrgId)
            {
                ou = getParentOrgUnitById(parentOU.id);
                if(ou != null)
                    searchOrgUnitByParent(ou.id);
            }
            else
                showLevel1OrgUnit(parentOU);
        }
        else
        {
            ou = getParentOrgUnitById(parentOU.id);
            if(ou != null)
                searchOrgUnitByParent(ou.id);
        }
    }
    showTable();
}

/**
 * Adds data into dropdown
 * @param {string} data
 * @param {string} dropdownName
 */
function setDataIndropdown(data,dropdownName){
    $(data).each(function()
    {
        var option = $('<option />');
        option.attr('value', this.id).text(this.name);

        $('#'+dropdownName).append(option);
    });
}

/**
 * post bulk data values using DHIS web API into DHIS table.
 * @returns {undefined} */
function postBulkDataValues(dataXML){
    var dfr = $.Deferred();
    $.ajax({
        url: serverUrl + '/api/dataValueSets',
        headers: {
            'Content-Type': 'application/xml',
            'Accept' : 'application/xml'
        },
        type: "POST",
        cache: false,
        crossDomain: true,
        data: dataXML,
        xhrFields: {
            withCredentials: true
        },
        success: function(data) {
            console.log(data.documentElement.childNodes[1].childNodes[0].nodeValue);
            alert(data.documentElement.childNodes[1].childNodes[0].nodeValue);
        }
    });
    return dfr.promise();
}

function corsSetup() {
    $.ajaxSetup({
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        cache: false,
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        }
    });
}


function doValidation(){
    $('#messageDiv').empty();
    var indicatorId = $('#indicators :selected').val();
    var periodId = $('#periods :selected').val();
    var valid = true;
    if(indicatorId == 'Select')
    {
        $('#messageDiv').append('Please Select Indicator. ');
        valid = false;
    }
    if($("input:checked").length == 0)
    {
        $('#messageDiv').append('Please Select Chart or Table Option.');
        valid = false;
    }
    
    if(valid)
        doAnalysis(indicatorId,periodId);
    else
    {
        $('#chartDiv').empty();
        $('#tableDiv').empty();
    }    
}

function doAnalysis(indicatorId,periodId){
    
    $('#chartDiv').empty();
    $('#tableDiv').empty();
    $("input[name=analysisType]:checked").each(function() {
        if($(this).val() == 'Chart') {
            addCharts(indicatorId,periodId);
        }
        if($(this).val() == 'Table') {
            drawTable(jsonData, indicatorId)
        }
     });
}

/**
 * Add charts Dynamicaly.
 * @param {String} indicatorId
 * @param {String} parentId
 */
function addCharts(indicatorId, periodId){
    $('#chartDiv').empty();
    $(displayOrgUnits).each(function()
    {
        var divData = '<div>';

        if(displayOrgUnits.length > 1)
            divData += '<a href=# onclick="goUp(\''+this.id+'\')"><img border="0" title="↑" src="./img/move_up.png"></a>';

        if(this.level != orgUnitLevels.organisationUnitLevels.length)
            divData += '<a href=# onclick="goDown(\''+this.id+'\')"><img border="0" title="↑" src="./img/move_down.png"></a>';
        divData += '<div id=\''+this.id+'\' class=\'chart2\'></div></div>';
        
        $('#chartDiv').append(divData);
        getCharts(indicatorId, periodId, this.id, this.id);
    });
}

function getCharts(indicatorId, periodId, ouId, element) {
    console.log('indicatorId, periodId, ouId, element '+indicatorId+' '+ periodId+' '+ ouId+' '+ element);
    DV.plugin.getChart({
        url: serverUrl+'/',
        el: element,
        type: 'column',
        columns: [
            {dimension: 'de', items: [{id: indicatorId}]}
        ],
        rows: [
            {dimension: 'pe', items: [{id: periodId}]}
        ],
        filters: [
            {dimension: 'ou', items: [{id: ouId}]}
        ],
        showData: true,
        targetLineValue: 70
    });
}

function drawTable(jsonData, indicatorId){
    $('#tableDiv').empty();
    if(jsonData.rows.length > 0)
    {
        var table = '<table border="1">';
        table += '<tr><td>'+jsonData.metaData.names.pe+'</td><td>'+jsonData.metaData.names[indicatorId]+'</td></tr>';
        $.each(jsonData.rows, function(rowIndex,rowObj ) {
            table += '<tr><td>'+jsonData.metaData.names[rowObj[1]]+'</td><td>'+rowObj[2]+'</td></tr>';
        });

        table += '</table>';
        console.log('table = '+table);
        $('#tableDiv').append(table);
    }
    else
    $('#messageDiv').append('No data found.');
}

