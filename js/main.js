var manifestData;
var serverUrl;
var tableData = new Array();
var orgUnitData = new Object();
var dataElementGroupData = new Object();
var indicatorsData = new Object();
var orgUnitLevels = new Array();
var chartArr = new Array();
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
    doValidation();
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
        $('#analysisDiv').empty();
    }    
}

function doAnalysis(indicatorId,periodId){
    $('#analysisDiv').empty();
    chartArr = new Array();
    $.each(displayOrgUnits, function(ouIndex,ou ) { 
        getDataFromDhis(indicatorId,periodId,ou,ouIndex);
    });
    
    changeChartProperties();
}

function createChartAndTable(jsonData,indicatorId,periodId,ou,ouIndex){
    console.log('ou '+ou.name + ' periodId '+periodId +' indicatiorId '+indicatorId);
    console.log('jsonData '+jsonData);
    if(jsonData)
    {
        var data = jsonToD3ChartJson(jsonData, indicatorId);
        console.log("Chnaged json "+JSON.stringify(data));
        
        $("input[name=analysisType]:checked").each(function() {
            if($(this).val() == 'Chart') {
                addCharts(data, ou, ouIndex);
            }
            if($(this).val() == 'Table') {
                drawTable(data, ouIndex);
            }
        });
        
    }
}

//http://localhost:8080/dhis/api/analytics.json?dimension=dx:Uvn6LCg7dVU&dimension=pe:LAST_12_MONTHS&filter=ou:O6uvpzGd5pu
/**
 * Get data for chart and table using DHIS web API.
 * */
function getDataFromDhis(indicatorId,periodId,ou,ouIndex) {
    var result;
    $.ajax({
        url: serverUrl + '/api/analytics.json?dimension=dx:' + indicatorId + '&dimension=pe:' +periodId+ '&filter=ou:' +ou.id,
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
            createChartAndTable(data,indicatorId,periodId,ou,ouIndex);
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        $.blockUI({message: $('#failureMessage')});
    });
    console.log('result '+result);
    return result;
}

function changeChartProperties(){
    console.log("Inside changeChartProperties()");
    var xTicks = d3.selectAll('.nv-groups > g').selectAll('g');
        xTicks.selectAll('text')
        .style("font","10px sans-serif");

    //chart.xAxis.rotateLabels(45);
    var xTicks = d3.selectAll('.nv-x.nv-axis > g').selectAll('g');
     xTicks.selectAll('text')
    .attr('transform', function(d,i,j) { return 'translate (-20, 40) rotate(-55 0,0)' });

    
    $.each(chartArr, function(index,chart )
    {
        nv.utils.windowResize(chart.update);
    });
}
/**
 * Add charts Dynamicaly.
 * @param {String} indicatorId
 * @param {String} parentId
 */
function addCharts(data, ou, index){
    var divData = '<div style="border-style:solid;float:left;display:inline-block;width:560px;margin:5px;">';
    divData += '<table id="chart_'+index+'" width="100%"><tr><td width="20px">';
    
    if(displayOrgUnits.length > 1)
        divData += '<a href=# onclick="goUp(\''+ou.id+'\')"><img border="0" title="↑" src="./img/move_up.png"></a>';
    
    divData += '</td><td style="padding-top: 6px;">';
    
    if(ou.level != orgUnitLevels.organisationUnitLevels.length)
        divData += '<a href=# onclick="goDown(\''+ou.id+'\')"><img border="0" title="↑" src="./img/move_down.png"></a>';
    
    divData += '</td>';
    
    if(data)
    {
        divData += '<td style="text-align:center;">'+ou.name +' - '+data.key+'</td></tr><tr>';
        divData += '<td colspan="3"><svg></svg>';
        divData += '</td></tr></table></div>';

        $('#analysisDiv').append(divData);

        chartArr[index] = nv.models.discreteBarChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .staggerLabels(true)
            .tooltips(false)
            .showValues(true)

        chartArr[index].margin({bottom: 100});

        d3.select('#chart_'+index+' svg')
            .datum(data)
          .transition().duration(500)
          .call(chartArr[index]);

        d3.selectAll("rect")
          .style("fill","blue");

        nv.utils.windowResize(chartArr[index].update);
    }
    else
    {
       divData += '<td>No Data Found for '+ou.name+'</td></tr></table>';
       $('#analysisDiv').append(divData);
    }
    
}

function drawTable(data, index){
    if(data[0].values.length > 0)
    {
        var table = '<div id="table_'+index+'"><table border="1">';
        table += '<tr><td>Period</td><td>'+data[0].key+'</td></tr>';
        $.each(data[0].values, function(valIndex,valueObj ) {
            table += '<tr><td>'+valueObj.label+'</td><td>'+valueObj.value+'</td></tr>';
        });

        table += '</table></div>';
        $('#analysisDiv').append(table);
    }
    else
    $('#analysisDiv').append('No data found.');
}

function jsonToD3ChartJson(jsonData, indicatorId){
    var data;
    if(jsonData.rows.length > 0)
    {
        data = [{ 
            key :  jsonData.metaData.names[indicatorId],
            values : []
        }];

        $.each(jsonData.rows, function(rowIndex,rowObj ) {
            var valuesData = {};
            valuesData["label"] = jsonData.metaData.names[rowObj[1]];
            valuesData["value"] = parseInt(rowObj[2]);
            data[0].values.push(valuesData);
        });
    }
    return data;
}