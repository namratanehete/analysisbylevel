function createHighChart(divName, titleText, data, xAxisCategories) {
    divName.highcharts({
        credits: false,
        chart: {
            marginBottom:150
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
                    text: 'Data Elements',
                    style: {
                        color: '#4572A7'
                    }
                }
            }, {// Secondary yAxis
                title: {
                    text: 'Indicators',
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
    console.log(categories);
    return categories;
}

function convertDHISJsonToChartJson(jsonData, dxParams) {
    var data = [];
    jsonData.metaData.pe.sort();
    console.log('jsonData '+JSON.stringify(jsonData.rows));
    console.log(JSON.stringify(dataElementData));
    $.each(dxParams, function(index, param) {
        if ($('#indicators :selected').val() == param)
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
    console.log('data '+JSON.stringify(data));
    return data;
}

function getDataToDisplayInGraph(jsonData, id)
{
    var data = [];
    var periodData = [];

        $.each(jsonData.rows, function(rowIndex, rowObj) {
            if(rowObj[0]== id)
                periodData[rowIndex] = rowObj[1];
        });
        
        rowDataStr = JSON.stringify(jsonData.rows);
        $.each(jsonData.metaData.pe, function(peIndex, peObj) {
            var index = periodData.indexOf(peObj);
            if (index == -1)
                data.push(0);
            else
                data.push(parseFloat(jsonData.rows[index][2]));
        });
   return data;
}

function addCharts(data, ou, index, jsonData) {

    var divData = '';

    if (displayOrgUnits.length > 1)
        divData += '<a href=# onclick="goUp(\'' + ou.id + '\')"><img border="0" width="16" heigth="16" title="↑" src="./img/up.png"></a>';

    if (searchOrgUnitByParent(ou.id).length > 0)
        divData += '<a href=# onclick="goDown(\'' + ou.id + '\')"><img border="0" width="16" heigth="16" title="↑" src="./img/down.png"></a>';
    
    divData += '<div class="chart_' + index+'"></div>';
    $('#chart_' + index).append(divData);
    
    var divName = $('.chart_' + index);   
    createHighChart(divName,ou.name,data,getXAxisCategories(jsonData));
}

