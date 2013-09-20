var manifestData;
var serverUrl;
var tableData = new Array();
var orgUnitData = new Array();
var dataElementGroupData = new Array();
var dataElementData = new Array();
var indicatorsData = new Array();
var chartArr = new Array();
var parentUserOrgId;
var displayOrgUnits = [];
var dataArr = [];
var totalMetaDataTypes = 0;

//@TODO select data elements
//Select either Data Elements or Indicator
//Do validation
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
            $.blockUI({message: '<h1> Loading...</h1>'});
            loadDhisMetadata('indicators');
            loadDhisMetadata('organisationUnits');
            loadDhisMetadata('dataElementGroups');
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
            setData(metaDataType, data);
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
function setData(metaDataType, dataStr) {
    totalMetaDataTypes++;
    if (metaDataType == 'organisationUnits')
    {
        orgUnitData = dataStr;
        showLevel1OrgUnit(null);
        //console.log("orgUnitData = "+orgUnitData.organisationUnits.length);
    }
    else if (metaDataType == 'indicators')
    {
        indicatorsData = dataStr;
        setDataInDropdown(indicatorsData.indicators, metaDataType);
        //console.log("indicators = "+indicatorsData.indicators.length);
    }
    else if (metaDataType == 'dataElementGroups')
    {
        dataElementGroupData = dataStr;
        setDataInDropdown(dataElementGroupData.dataElementGroups, metaDataType);
        //console.log("indicators = "+indicatorsData.indicators.length);
    }
    if (totalMetaDataTypes == 3)
    {
        $.unblockUI();
    }
}

function getDataElements() {
    if ($('#dataElementGroups :selected').val() != 'Select')
    {
        dataElementData = new Array();
        $("#dataElements").empty();
        $.ajax({
            url: serverUrl + '/api/dataElementGroups/' + $('#dataElementGroups :selected').val(),
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
                dataElementData = data.dataElements;
                $("#dataElements").empty();
                setDataInDropdown(dataElementData, 'dataElements');
                showMultiSelectDropdown();
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.blockUI({message: $('#failureMessage')});
        });
    }
    else
    {
        $("#dataElements").empty();
        $("#dataElements").multiselect('refresh');
    }
}

function showMultiSelectDropdown() {

    $("#dataElements").multiselect({
        header: "Choose DataElements!",
        click: function(e) {
            if ($(this).multiselect("widget").find("input:checked").length > 2) {
                showWarning("You can select only two data elements!", 2000);
                return false;
            }
        }
    });
    $("#dataElements").multiselect('refresh');
}

function showWarning(msg, timeoutSeconds) {
    var warning = $(".message");
    warning.css("display", "block");
    warning.addClass("error").removeClass("success").html(msg);
    setTimeout(function() {
        warning.fadeOut("slow", function() {
            warning.css("display", "none");
        });
    }, timeoutSeconds);
}

function sortJson(data, prop) {
    return data.sort(function(a, b) {
        var x = a[prop];
        var y = b[prop];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

/**
 * Adds data into dropdown
 * @param {string} data
 * @param {string} dropdownName
 */
function setDataInDropdown(data, dropdownName) {
    if (data)
        sortJson(data, "name");

    $(data).each(function()
    {
        var option = $('<option />');
        option.attr('value', this.id).text(this.name);

        $('#' + dropdownName).append(option);
    });
}

function doValidation() {

    var indicatorId = $('#indicators :selected').val();
    var dataElements = $('#dataElements').val();
    var periodId = $('#periods :selected').val();
    var valid = true;
    if (indicatorId == 'Select' && !dataElements)
    {
        showWarning('Please Select Indicator or DataElements.', 2000);
        valid = false;
    }
    else
    {
        if ($("input:checked").length == 0)
        {
            showWarning('Please Select Chart or Table Option.', 2000);
            valid = false;
        }
    }
    if (valid)
    {
        var dxParams = [];

        $.each(dataElements, function() {
            dxParams.push(this);
        });

        (indicatorId != 'Select') ? dxParams.push(indicatorId) : '';
        getDataFromDhis(dxParams, periodId);
    }
    else
    {
        $('#analysisDiv').empty();
    }
}

/**
 * Get data for chart and table using DHIS web API.
 * */
function getDataFromDhis(dxParams, periodId) {
    $('#analysisDiv').empty();
    chartArr = new Array();
    $.each(displayOrgUnits, function(ouIndex, ou) {
        createDivForChartAndTable(ouIndex);

        var dx = '';

        $.each(dxParams, function(index, param) {
            dx += param;
            if (index != (dxParams.length - 1))
                dx += ';';
        });
        
        $.ajax({
            url: serverUrl + '/api/analytics.json?dimension=dx:' + dx + '&dimension=pe:' + periodId + '&filter=ou:' + ou.id,
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
                createChartAndTable(data, dxParams, periodId, ou, ouIndex);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.blockUI({message: $('#failureMessage')});
        });
    });
}

function createDivForChartAndTable(ouIndex) {
    var divData = '<div id="div_' + ouIndex + '" style="float:left;display:inline-block;">';
    $("input[name=analysisType]:checked").each(function() {
        if ($(this).val() == 'Chart') {
            divData += '<div id="chart_' + ouIndex + '" style="border:1px solid;float:left;display:inline-block;width:500px;margin:5px;"></div>';
        }
        if ($(this).val() == 'Table') {
            divData += '<div id="table_' + ouIndex + '" style="float:left;display:inline-block;"></div>';
        }
    });
    divData += '</div>';
    $('#analysisDiv').append(divData);
}

function createChartAndTable(jsonData, dxParams, periodId, ou, ouIndex) {
    if (jsonData)
    {
        var data = convertDHISJsonToChartJson(jsonData, dxParams);
        dataArr[ouIndex] = data;
        $("input[name=analysisType]:checked").each(function() {
            if ($(this).val() == 'Chart') {
                addCharts(data, ou, ouIndex, jsonData);
            }
            if ($(this).val() == 'Table') {
                drawTable(data, ou, ouIndex);
            }
        });
    }
}


function drawTable(data, ou, index) {

    var table = '<table border="1" style="margin:5px;font: 11px sans-serif;">';
    table += '<tr><td style="text-align:center;font-weight: bold;" colspan="2">' + ou.name + '</td></tr>';
    table += '<tr><td style="text-align:center;">';
    if (displayOrgUnits.length > 1)
        table += '<a href=# onclick="goUp(\'' + ou.id + '\')"><img border="0" width="16" heigth="16" title="↑" src="./img/up.png"></a>';

    if (searchOrgUnitByParent(ou.id).length > 0)
        table += '<a href=# onclick="goDown(\'' + ou.id + '\')" style="padding-left:5px;"><img border="0" width="16" heigth="16" title="↑" src="./img/down.png"></a></div>';

    table += '</td>';
    table += '<td>' + data[0].key + '</td></tr>';
    $.each(data[0].values, function(valIndex, valueObj) {
        table += '<tr><td style="padding:2px;" colspan="1">' + valueObj.label + '</td><td style="padding: 2px; text-align: right;">' + valueObj.value + '</td></tr>';
    });

    table += '</table>';
    $('#table_' + index).append(table);
}

