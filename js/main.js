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
//when Select either Data Elements or Indicator show correct axis names
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
       // $.blockUI({message: 'Could not load manifest'});
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
        //$("#indicatorsLbl").css("display", "block");
        setDataInDropdown(indicatorsData.indicators, metaDataType);
        //$("#indicatorsTd").css("display", "block");
        showMultiSelectDropdown($("#indicators"),"Choose Indicators!", "You can select maximum four Indicators!");
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

/**
 * Gets dat elemnets for selected dataElementGroup through ajax call
 * On success sets dropbox wih data elements.*/
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
                var className = $("#dataElements");
                showMultiSelectDropdown($("#dataElements"),"Choose DataElements!", "You can select maximum four data elements!");
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

/**
 * Shows multi select drop down in page*/
function showMultiSelectDropdown(className,header, warningMsg) {

    className.multiselect({
        header: header,
        click: function(e) {
            if ($(this).multiselect("widget").find("input:checked").length > 4) {
                showWarning(warningMsg, 2000);
                return false;
            }
        }
    });
    className.multiselect('refresh');
}

/**
 * Shows warning messages
 * @param {string} msg
 * @param {string} timeoutSeconds
 * */
function showWarning(msg, timeoutSeconds) {
    var warning = $(".message");
    warning.css("display", "block");
    warning.css("text-align", "right");
    warning.addClass("error").removeClass("success").html(msg);
    setTimeout(function() {
        warning.fadeOut("slow", function() {
            warning.css("display", "none");
        });
    }, timeoutSeconds);
}

/**
 * Sort json as per given property
 * @param {type} data
 * @param {type} prop
 */
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

/**
 * Check for validation for each required field in page.
 */
function doValidation() {

    var indicators = $('#indicators').val();
    var dataElements = $('#dataElements').val();
    var periodId = $('#periods :selected').val();
    var valid = true;
    if (!indicators && !dataElements)
    {
        showWarning('Please Select Indicators and/or DataElements.', 2000);
        valid = false;
    }
    else
    {
        console.log($("input[name=analysisType]:checked").length);
        if ($("input[name=analysisType]:checked").length == 0)
        {
            showWarning('Please Select Chart or Table Option.', 2000);
            valid = false;
        }
        else if($("#thresholdChk:checked").val() == "on")
        {
            if (indicators && dataElements)
            {
                showWarning('Please Select either Indicators or DataElements.', 2000);
                valid = false;
            }
        }
        
    }
    if (valid)
    {
        var dxParams = [];
        var peParams = [];
        peParams.push(periodId);
        
        if (dataElements)
        {
            $.each(dataElements, function() {
                dxParams.push(this);
            });
        }
        if (indicators)
        {
            $.each(indicators, function() {
                dxParams.push(this);
            });
        }
        
        getDataFromDhis(dxParams, peParams);
    }
    else
    {
        $('#analysisDiv').empty();
    }
}

/**
 * Get data for chart and table using DHIS web API.
 * */
function getDataFromDhis(dxParams, peParams) {
    $('#analysisDiv').empty();
    chartArr = new Array();
    $.each(displayOrgUnits, function(ouIndex, ou) {
        createDivForChartAndTable(ouIndex);

        var dx = '';
        var pe = '';

        $.each(dxParams, function(index, param) {
            dx += param;
            if (index != (dxParams.length - 1))
                dx += ';';
        });
        //&dimension=pe:2012Q1;2012Q2
        $.each(peParams, function(index, param) {
            pe += param;
            if (index != (peParams.length - 1))
                pe += ';';
        });
        $.ajax({
            url: serverUrl + '/api/analytics.json?dimension=dx:' + dx + '&dimension=pe:' + pe + '&filter=ou:' + ou.id,
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
                createChartAndTable(data, dxParams, ou, ouIndex,'Data Elements','Indicators');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.blockUI({message: $('#failureMessage')});
        });
    });
}

/**
 * Get data for chart and table using DHIS web API.
 * */
function createDivForChartAndTable(ouIndex) {
    var divData = '<div id="div_' + ouIndex + '" style="float:left;display:inline-block;">';
    $("input[name=analysisType]:checked").each(function() {
        if ($(this).val() == 'Chart') {
            divData += '<div id="chart_' + ouIndex + '" style="border:1px solid;float:left;display:inline-block;width:650px;margin:5px;"></div>';
        }
        if ($(this).val() == 'Table') {
            divData += '<div id="table_' + ouIndex + '" style="float:left;display:inline-block;"></div>';
        }
    });
    divData += '</div>';
    $('#analysisDiv').append(divData);
}

/**
 * calls addcharts or draw table method depend on selection
 * @param {type} jsonData
 * @param {type} dxParams: dimension params
 * @param {type} ou
 * @param {type} ouIndex
 * @param {type} xAxisLabel
 * @param {type} yAxisLabel
 */
function createChartAndTable(jsonData, dxParams, ou, ouIndex, xAxisLabel, yAxisLabel) {
    if (jsonData)
    {
        var data = convertDHISJsonToChartJson(jsonData, dxParams);
        dataArr[ouIndex] = data;
        var categories = getXAxisCategories(jsonData);
        $("input[name=analysisType]:checked").each(function() {
            if ($(this).val() == 'Chart') {
                addCharts(data, ou, ouIndex, categories, xAxisLabel, yAxisLabel);
            }
            if ($(this).val() == 'Table') {
                var tableData = convertJsonToTableJson(jsonData, dxParams);
                drawTable(tableData, ou, ouIndex);
            }
        });
    }
}

/**
 * creates table as per data in page. 
 * @param {type} data
 * @param {type} ou
 * @param {type} index
 * @param {type} categories
 */
function drawTable(data, ou, index) {

    var totalTds = data[0].keys.length + 1;
    var table = '<table border="1" style="font: 11px sans-serif;">';
    table += '<tr><td style="text-align:center;font-weight: bold;" colspan="'+totalTds+'">' + ou.name + '</td></tr>';
    table += '<tr><td style="text-align:center;">';
    if (displayOrgUnits.length > 1)
        table += '<a href=# onclick="goUp(\'' + ou.id + '\')"><img border="0" width="16" heigth="16" title="↑" src="./img/move_up.png"></a>';

    if (searchOrgUnitByParent(ou.id).length > 0)
        table += '<a href=# onclick="goDown(\'' + ou.id + '\')" style="padding-left:5px;"><img border="0" width="16" heigth="16" title="down" src="./img/move_down.png"></a></div>';

    table += '</td>';
    $.each(data[0].keys, function() {
        table += '<td>' + this + '</td>';
    });

    table += '</tr>';
    $.each(data, function(valIndex, dataObj) {
        table += '<tr><td style="padding:2px;" colspan="1">' + dataObj.period + '</td>';
        $.each(dataObj.values, function(valIndex, value) {
            table += '<td style="padding: 2px; text-align: right;">' + value + '</td>';
        });
        table += '</tr>';
    });

    table += '</table>';
    $('#table_' + index).append(table);
}

