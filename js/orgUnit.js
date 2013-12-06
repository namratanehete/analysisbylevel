/**
 * shows Level 1 Org Unit in Table
 * @param {Object} ou
 */
function showLevel1OrgUnit(ou) {
    displayOrgUnits = [];
    if (ou == null)
    {
        $.each(orgUnitData.organisationUnits, function(index, ou) {
            if (ou.parent == null) {
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
function searchOrgUnitByParent(parentUid) {

    var orgUnitArr = [];
    if (parentUid != null)
    {
        $.each(orgUnitData.organisationUnits, function(index, ou) {
            if (ou.parent != null)
            {
                if (ou.parent.id == parentUid) {
                    orgUnitArr.push(ou);
                }
            }
        });

    }
    if (orgUnitArr)
        sortJson(orgUnitArr, 'name');

    return orgUnitArr;
}

/** 
 * Get parent organisation unit by passing Id.
 * @param {String} uid
 */
function getParentOrgUnitById(uid) {

    var parentOu;

    $.each(orgUnitData.organisationUnits, function(index, ou) {
        if (ou.id == uid) {
            if (ou.parent != null)
            {
                //console.log("Returning parent ou as "+ou.parent.name);
                parentOu = ou.parent;
            }
            return false;
        }
    });

    return parentOu;
}

/**
 * Go to children orgunit level hierachy
 * @param {type} uid
 * @returns doValidation()
 */
function goDown(uid) {

    displayOrgUnits = [];
    displayOrgUnits = searchOrgUnitByParent(uid);
    doValidation();
}

/**
 * Go to parent orgunit level hierachy
 * @param {type} uid
 * @returns doValidation()
 */
function goUp(uid) {

    var parentOU = getParentOrgUnitById(uid);
    var ou;

    if (parentOU != null)
    {
        if (parentUserOrgId != null)
        {
            if (parentOU.id != parentUserOrgId)
            {
                ou = getParentOrgUnitById(parentOU.id);
                if (ou != null)
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
            if (ou != null)
            {
                displayOrgUnits = [];
                displayOrgUnits = searchOrgUnitByParent(ou.id);
            }
        }
    }
    doValidation();
}

