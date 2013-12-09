function createHighChart(divName, titleText, data, xAxisCategories, xAxisTitle, yAxisTitle) {
    divName.highcharts({
        credits: false,
        chart: {
            marginBottom:150,
            rotation: -90,
        },
        title: {
            text: titleText
        },
        subtitle: {
            text: ''
        },
        xAxis: [{
                categories: xAxisCategories,
                labels: {
                    rotation: -45,
                    align: 'right',
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            }],
        yAxis: [{// Primary yAxis
                labels: {
                    format: '{value}',
                    style: {
                        color: '#4572A7'
                    }
                },
                title: {
                    text: xAxisTitle,
                    style: {
                        color: '#4572A7'
                    }
                }
            }, {// Secondary yAxis
                title: {
                    text: yAxisTitle,
                    style: {
                        color: '#8bbc21'
                    }
                },
                labels: {
                    format: '{value}',
                    style: {
                        color: '#8bbc21'
                    }
                },
                opposite: true
            }],
        tooltip: {
            shared: true
        },
        series: data
    });
}

function getXAxisCategories(jsonData){
    var categories = [];
    jsonData.metaData.pe.sort();
    $.each(jsonData.metaData.pe, function(peIndex, peObj) {
            categories[peIndex] = jsonData.metaData.names[peObj];
    });
    //console.log(categories);
    return categories;
}

function convertDHISJsonToChartJson(jsonData, dxParams) {
    var data = [];
    jsonData.metaData.pe.sort();
   // console.log('jsonData '+JSON.stringify(jsonData.rows));
   // console.log(JSON.stringify(dataElementData));
    $.each(dxParams, function(index, param) {
        if ($('#indicators').val() && $('#indicators').val().indexOf(param.toString()) != -1)
        {
            item = {};
            item ["name"] = jsonData.metaData.names[param];
            item ["type"] = 'spline';
            item ["yAxis"] = 1;
            item ["data"] = getDataToDisplayInGraph(jsonData, param);
            data.push(item);
        }
        else
        {
            item = {};
            item ["name"] = jsonData.metaData.names[param];
            item ["type"] = 'column';
            item ["data"] = getDataToDisplayInGraph(jsonData, param);
            data.push(item);
        }
    });
    //console.log('data '+JSON.stringify(data));
    return data;
}

function convertDHISJsonWithThresholdToChartJson(jsonData, dxParams) {
    var data = [];
    jsonData.metaData.pe.sort();
   // console.log('jsonData '+JSON.stringify(jsonData.rows));
   // console.log(JSON.stringify(dataElementData));
    $.each(dxParams, function(index, param) {
        if ($('#indicators').val() && $('#indicators').val().indexOf(param.toString()) != -1)
        {
            item = {};
            item ["name"] = jsonData.metaData.names[param];
            item ["type"] = 'column';
            item ["data"] = getDataToDisplayInGraph(jsonData, param);
            data.push(item);
        }
        else if($('#dataElements').val() && $('#dataElements').val().indexOf(param.toString()) != -1)
        {
            item = {};
            item ["name"] = jsonData.metaData.names[param];
            item ["type"] = 'column';
            item ["data"] = getDataToDisplayInGraph(jsonData, param);
            data.push(item);
        }
        else
        {
            item = {};
            item ["name"] = jsonData.metaData.names[param];
            item ["type"] = 'spline';
            item ["dashStyle"] = 'shortdot';
            item ["data"] = getDataToDisplayInGraph(jsonData, param);
            data.push(item);
        }
    });
    
    //console.log('data '+JSON.stringify(data));
    return data;
}

function convertJsonToTableJson(jsonData, params){
    jsonData.metaData.pe.sort();
    var data = [];
    //console.log('jsonData '+JSON.stringify(jsonData.rows));
    $.each(jsonData.metaData.pe, function(peIndex, peObj) {
        item = {};
        item ["period"] = jsonData.metaData.names[peObj];
        item ["keys"] = [];
        item ["values"] = [];
        
        var keyData = [];
        var valueData = [];

        $.each(jsonData.rows, function(rowIndex, rowObj) {
            if(rowObj[1] == peObj)
            {
                if(rowObj[0] && keyData.indexOf(rowObj[0]) == -1)
                {
                    keyData[keyData.length] = rowObj[0];
                    valueData[valueData.length] = rowObj[2];
                }
            }
        });
        $.each(params, function (ind,param){
            var index = keyData.indexOf(param.toString());
            //console.log('index of param '+param + ' is '+index);
            item.keys.push(jsonData.metaData.names[param]);
            if (index == -1)
                item.values.push(0);
            else
                item.values.push(parseFloat(valueData[index]));
        });
        data.push(item);
    });
    //console.log('data '+JSON.stringify(data));
    return data;
}

function getDataToDisplayInGraph(jsonData, deId){
    var data = [];
    var periodData = [];

        $.each(jsonData.rows, function(rowIndex, rowObj) {
            if(rowObj[0]== deId)
                periodData[rowIndex] = rowObj[1];
        });
        
        $.each(jsonData.metaData.pe, function(peIndex, peObj) {
            var index = periodData.indexOf(peObj);
            if (index == -1)
                data.push(0);
            else
                data.push(parseFloat(jsonData.rows[index][2]));
        });
   return data;
}

function getDataByPeriodForParam(jsonData, deId, periodId){
    var data = 0.0;

    $.each(jsonData.rows, function(rowIndex, rowObj) {
        if(rowObj[0]== deId && rowObj[1] == periodId)
            data = parseFloat(rowObj[2]);
    });
    
    return data;
}

function addCharts(data, ou, index, categories,xAxisLabel, yAxisLabel) {

    var divData = '';

    if (displayOrgUnits.length > 1)
        divData += '<a href=# onclick="goUp(\'' + ou.id + '\')"><img border="0" width="16" heigth="16" title="↑" src="./img/move_up.png"></a>';

    if (searchOrgUnitByParent(ou.id).length > 0)
        divData += '<a href=# onclick="goDown(\'' + ou.id + '\')"><img border="0" width="16" heigth="16" title="↑" src="./img/move_down.png"></a>';
    
    divData += '<div class="chart_' + index+'"></div>';
    $('#chart_' + index).append(divData);
    
    var divName = $('.chart_' + index);   
    createHighChart(divName,ou.name,data,categories, xAxisLabel, yAxisLabel);
}

