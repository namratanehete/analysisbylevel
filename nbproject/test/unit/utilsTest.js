UtilTest = TestCase("UtilTest");

UtilTest.prototype.testSearchPeriodColumn = function() {
    
    var data = testScenario4Data.worksheets[0].data[0];
    assertNotEquals(searchPeriodColumn(data), '-1');
    assertEquals(searchPeriodColumn(data), '3');
    //assertEquals(searchPeriodColumn("something bad"), '-1');
}


UtilTest.prototype.testSearchPeriodPosition = function() {
    
    
    var data = searchPeriodPosition(testScenario4Data.worksheets[0]);
    //alert(data.length);
    assertNotEquals(data.length,'-1');
    assertEquals(data.length,'2');
    
}

UtilTest.prototype.testSearchOrgUnitPosition = function() {
    var data = searchOrgUnitPosition(testScenario4Data.worksheets[0],testOrgUnitdata.organisationUnits);
    //alert(data.length);
    assertNotEquals(data.length,'-1');
    assertEquals(data.length,'2');
}

UtilTest.prototype.testSearchDataElementPosition = function() {
    var data = searchDataElementPosition(testScenario1Data.worksheets[0],testDataElementsData.dataElements);
    //alert(data.length);
    assertNotEquals(data.length,'-1');
    assertEquals(data.length,'2');
}

UtilTest.prototype.testGetDataValues = function() {
    getDataValues(testScenario4Data.worksheets[0]);
}



