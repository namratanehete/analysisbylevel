var manifestData;
var serverUrl;
var tableData = new Array();
var orgUnitData = new Array();
var dataElementGroupData = new Array();
var indicatorsData = new Array();
var chartArr = new Array();
var parentUserOrgId;
var displayOrgUnits = [];
var dataArr = [];
var totalMetaDataTypes = 0;


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
            $.blockUI({ message: '<h1> Loading...</h1>' });
            loadDhisMetadata('indicators');
            loadDhisMetadata('organisationUnits');
            loadDhisMetadata('dataElementsGroups');
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
    totalMetaDataTypes++;
    if(metaDataType == 'organisationUnits')
    {
        orgUnitData = dataStr;
        showLevel1OrgUnit(null);
        //console.log("orgUnitData = "+orgUnitData.organisationUnits.length);
    }
    else if(metaDataType == 'indicators')
    {
         indicatorsData = dataStr;
         setDataIndropdown(indicatorsData.indicators,metaDataType);
         //console.log("indicators = "+indicatorsData.indicators.length);
    }
    else if(metaDataType == 'dataElementsGroups')
    {
         dataElementGroupData = dataStr;
         setDataIndropdown(dataElementGroupData.dataElements,metaDataType);
         //console.log("indicators = "+indicatorsData.indicators.length);
    }
    if(totalMetaDataTypes == 3)
        $.unblockUI();
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
                //console.log("Level 1 Ou = "+ou.name);
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
    
    var orgUnitArr = [];
    if(parentUid != null)
    {
        $.each(orgUnitData.organisationUnits, function(index, ou) {
            if(ou.parent != null)
            {
                if (ou.parent.id == parentUid) {
                    orgUnitArr.push(ou);
                }
            }
        });

    }
    sortJson(orgUnitArr,'name');
    return orgUnitArr;
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
                //console.log("Returning parent ou as "+ou.parent.name);
                parentOu = ou.parent;
            }
            return false;
        }
    });
    
    return parentOu;
}

function goDown(uid){
    
    displayOrgUnits = [];
    displayOrgUnits = searchOrgUnitByParent(uid);
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
                {
                    displayOrgUnits = [];
                    displayOrgUnits = searchOrgUnitByParent(ou.id);
                }
            }
            else
                showLevel1OrgUnit(parentOU);
        }
        else
        {
            ou = getParentOrgUnitById(parentOU.id);
            if(ou != null)
            {
                displayOrgUnits = [];
                displayOrgUnits = searchOrgUnitByParent(ou.id);
            }
        }
    }
    doValidation();
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
        getDataFromDhis(indicatorId,periodId);
    else
    {
        $('#analysisDiv').empty();
    }    
}

/**
 * Get data for chart and table using DHIS web API.
 * */
function getDataFromDhis(indicatorId,periodId) {
    $('#analysisDiv').empty();
    chartArr = new Array();
    $.each(displayOrgUnits, function(ouIndex,ou ) {
        var divData = '<div id="div_'+ouIndex+'" style="float:left;display:inline-block;">';
        $("input[name=analysisType]:checked").each(function() {
            if($(this).val() == 'Chart') {
                divData += '<div id="chart_'+ouIndex+'" style="border:1px solid;float:left;display:inline-block;width:500px;margin:5px;"></div>';
            }
            if($(this).val() == 'Table') {
                divData += '<div id="table_'+ouIndex+'" style="float:left;display:inline-block;"></div>';
            }
        });
        divData += '</div>';
        $('#analysisDiv').append(divData);
        
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
    });
}


function createChartAndTable(jsonData,indicatorId,periodId,ou,ouIndex){
    if(jsonData)
    {
        var data = jsonToD3ChartJson(jsonData, indicatorId);
        dataArr[ouIndex] = data;
        $("input[name=analysisType]:checked").each(function() {
            if($(this).val() == 'Chart') {
                addCharts(data, ou, ouIndex ,periodId);
            }
            if($(this).val() == 'Table') {
                drawTable(data, ou, ouIndex);
            }
        });
    }
}

/**
 * Add charts Dynamicaly.
 * @param {String} indicatorId
 * @param {String} parentId
 */
function addCharts(data, ou, index, periodId){
    
    var divData = '<table width="100%"><tr><td width="20px">';
    
    if(displayOrgUnits.length > 1)
        divData += '<a href=# onclick="goUp(\''+ou.id+'\')"><img border="0" width="16" heigth="16" title="↑" src="./img/up.png"></a>';
    
    divData += '</td><td>';
    
    if(searchOrgUnitByParent(ou.id).length > 0 )
        divData += '<a href=# onclick="goDown(\''+ou.id+'\')"><img border="0" width="16" heigth="16" title="↑" src="./img/down.png"></a>';
    
    divData += '</td>';
    
    divData += '<td style="text-align:center;">'+ou.name +' - '+data[0].key+'</td></tr><tr>';
    divData += '<td colspan="3"><svg></svg>';
    divData += '</td></tr></table>';
    
    $('#chart_'+index).append(divData);
    
    chartArr[index] = nv.models.discreteBarChart()
        .x(function(d) { return d.label })
        .y(function(d) { return d.value })
        .staggerLabels(true)
        .tooltips(false)
        .showValues(true)
        .valueFormat(d3.format('.f'));

    chartArr[index].yAxis.tickFormat(d3.format('.f'));

    chartArr[index].margin({bottom: 100});

    d3.select('#chart_'+index+' svg')
        .datum(data)
      .transition().duration(500)
      .call(chartArr[index]);

    d3.selectAll("rect")
      .style("fill","rgb(148,174,10)");

    //nv.utils.windowResize(chartArr[index].update);

    if(index == (displayOrgUnits.length -1))
        changeChartProperties(periodId);
}

function drawTable(data, ou, index){

    var table = '<table border="1" style="margin:5px;font: 11px sans-serif;">';
    table += '<tr><td style="text-align:center;font-weight: bold;" colspan="2">'+ou.name+'</td></tr>';
    table += '<tr><td style="text-align:center;">';
    if(displayOrgUnits.length > 1)
        table += '<a href=# onclick="goUp(\''+ou.id+'\')"><img border="0" width="16" heigth="16" title="↑" src="./img/up.png"></a>';

    if(searchOrgUnitByParent(ou.id).length > 0 )
        table += '<a href=# onclick="goDown(\''+ou.id+'\')" style="padding-left:5px;"><img border="0" width="16" heigth="16" title="↑" src="./img/down.png"></a></div>';

    table += '</td>';
    table += '<td>'+data[0].key+'</td></tr>';
    $.each(data[0].values, function(valIndex,valueObj ) {
        table += '<tr><td style="padding:2px;" colspan="1">'+valueObj.label+'</td><td style="padding: 2px; text-align: right;">'+valueObj.value+'</td></tr>';
    });

    table += '</table>';
    $('#table_'+index).append(table);
}

function changeChartProperties(periodId){
    
    var xTicks = d3.selectAll('.nvd3.nv-wrap.nv-discreteBarWithAxes > g').selectAll('g');
        xTicks.selectAll('text')
        .style("font","10.5px sans-serif");

    var xTicks = d3.selectAll('.nv-groups > g').selectAll('g');
        xTicks.selectAll('text')
        .style("font","9px sans-serif");
    
    //Draw x-axis when all values are zero chart do not draw x-axis
    var el = document.getElementsByClassName('nvd3 nv-wrap nv-discreteBarWithAxes')[0];
    var mywidth = el.getBoundingClientRect().width.toFixed(0);
    d3.selectAll('.nv-x')
    .append('g')
    .attr('class', 'hack')
    .append('line')
    .attr('id', 'hackXAxis')
    .attr('class', 'tick zero')
    .attr('x2', 420)
    .attr('y2',0);
    
    if(periodId == 'LAST_FINANCIAL_YEAR' || periodId == 'LAST_5_FINANCIAL_YEARS')
    {
        //chart.xAxis.rotateLabels(45);
        var xTicks = d3.selectAll('.nv-x.nv-axis > g').selectAll('g');
        xTicks.selectAll('text')
        .attr('transform', function(d,i,j) { return 'translate (-45, 40) rotate(-35 0,0)' });
    }
    else
    {//chart.xAxis.rotateLabels(45);
        var xTicks = d3.selectAll('.nv-x.nv-axis > g').selectAll('g');
         xTicks.selectAll('text')
        .attr('transform', function(d,i,j) { return 'translate (-20, 40) rotate(-55 0,0)' });
    }

}

function jsonToD3ChartJson(jsonData, indicatorId){
    var data = [{ 
            key :  jsonData.metaData.names[indicatorId],
            values : []
        }];
   
    jsonData.metaData.pe.sort();

    var periodData = [];
    if(jsonData.rows.length != jsonData.metaData.pe.length)
    {
        $.each(jsonData.rows, function(rowIndex,rowObj ) {
            periodData[rowIndex] = rowObj[1];
        });
        
        $.each(jsonData.metaData.pe, function(peIndex,peObj ) {
            var valuesData = {};
            valuesData["label"] = jsonData.metaData.names[peObj];
            var index = periodData.indexOf(peObj);
            if(index == -1)
                valuesData["value"] = 0;
            else
                valuesData["value"] = parseFloat(jsonData.rows[index][2]);

            data[0].values.push(valuesData);
        });
    }
    else
    {
        $.each(jsonData.rows, function(rowIndex,rowObj ) {
            var valuesData = {};
            valuesData["label"] = jsonData.metaData.names[rowObj[1]];
            valuesData["value"] = parseFloat(rowObj[2]);
            data[0].values.push(valuesData);
        });
    }
    
    //console.log(jsonData.metaData.ou + ' '+JSON.stringify(jsonData.rows));
    return data;
}
