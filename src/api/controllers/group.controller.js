const httpStatus = require('http-status');
const { omit } = require('lodash');
const User = require('../models/user.model');

const { teams } = require('../../config/teams.json');

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function createNonDomesticGroups(teams, maxTeamsInAGroup) {
  let currentGroupIndex = 0
  let groups = []
  for (let i = 0; i<8; i++) {
    groups.push({
      "teams": [],
      "countries": []
    })
  }
  
  let countries = [];
  let teamsByCountry = [];
  
  teams.forEach(team => {
    var idx = countries.indexOf(team.country);
    
    if (idx >= 0) {
      teamsByCountry[idx].push(team);
    } else {
      countries.push(team.country);
      teamsByCountry.push([team]);
    }
  });
  
  teamsByCountry.forEach(teams => {
    teams.forEach(team => {
      let inserted = false;

      while(!inserted) {
        if(
          groups[currentGroupIndex].teams.length < maxTeamsInAGroup &&
          (groups[currentGroupIndex].countries).indexOf(team.country) == -1
        ){
          groups[currentGroupIndex].teams.push(team);
          groups[currentGroupIndex].countries.push(team.country);

          inserted = true;
        }
        currentGroupIndex = currentGroupIndex + 1;

        if (currentGroupIndex == 8) {
          currentGroupIndex = currentGroupIndex - 8
        }
      }
    });
  });
  
  return groups;
}

/**
 * List Groups
 * @public
 */
exports.list = (req, res) => {
  // res.json(req.locals.user.transform())
  
  // shuffle and find domestic and non-domestic teams
  let domesticTeams = [];
  let nonDomesticTeams = [];
  
  shuffle(teams).forEach(team => {
    if(team.isDomestic) {
      domesticTeams.push(team)
    } else {
      nonDomesticTeams.push(team);
    }
  });

  // re-shuffle those teams for more better shuffling
  domesticTeams = shuffle(domesticTeams);
  nonDomesticTeams = shuffle(nonDomesticTeams);
  
  
  let leaderGroups = [];
  
  // Create groups of non-domestic teams
  let ngdt = createNonDomesticGroups(nonDomesticTeams, 3);

  
  // check which domestic team is allowed to be leader of which which non-domestic group
  for(var i=0; i<domesticTeams.length; i++) {
    var temp = {
      domesticTeam: domesticTeams[i],
      nonDomesticGroups: []
    };
    
    for(var j=0; j<ngdt.length; j++) {
      if (ngdt[j].countries.indexOf(domesticTeams[i].country) == -1) {
        temp.nonDomesticGroups.push(j)
      }
    }
    
    leaderGroups.push(temp)
  }
  
  // sort leader group based on how many non-domestic group leader it can be
  leaderGroups.sort((a, b) => {
    let lenA = a.nonDomesticGroups.length;
    let lenB = b.nonDomesticGroups.length;
    if (lenA < lenB) {
      return -1
    }
    
    if (lenA > lenB) {
      return 1
    }
    
    return 0
  });
  
  let tempGroups = [];
  let alreadyAddedGroup = [];

  // Create result based on domestic group and non-domestic group by check if group is alread attach to domestic or not
  for (var i=0; i<leaderGroups.length; i++) {
    let teams = [];
    teams.push(leaderGroups[i].domesticTeam);
    
    var temp = leaderGroups[i].nonDomesticGroups;
    
    for (var j=0; j<temp.length; j++) {
      if (alreadyAddedGroup.indexOf(temp[j]) == -1) {        
        teams = teams.concat(ngdt[temp[j]].teams);
        alreadyAddedGroup.push(temp[j]);
        break;
      }
    }
    
    tempGroups.push({
      "name": "Group " + (i+1),
      "teams": teams
    });
  }
  
  const groups = shuffle(tempGroups).map((group, idx) => {
    return {
      "name": "Group " + String.fromCharCode(idx + 65),
      "teams": group.teams
    }
  });

  res.json({
    "status": 200,
    "msg": "Group Listed Successfully",
    "data": groups
  });
};
