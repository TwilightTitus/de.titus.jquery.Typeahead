var GIVENNAMES = [
			"Peter",
			"Anna",
			"Nadine",
			"Frank",
			"Christian",
			"Chris",
			"Stein",
			"Jacob",
			"Sophia",
			"Mason",
			"Isabella",
			"William",
			"Emma",
			"Jayden",
			"Olivia"
		];
	
		var FAMILYNAMES = [
			"Anderson",
			"Archer",
			"Armstrong",
			"Baker",
			"Barber",
			"Bennett",
			"Bishop",
			"Black",
			"Blair",
			"Brewster",
			"Brown",
			"Carter",
			"Chaplin",
			"Coleman",
			"Collister",
			"Connor",
			"Cunningham",
			"Dearing",
			"Edison",
			"Edwards",
			"Eliot",
			"Franklin",
			"Garcia",
			"Hanson",
			"Harper",
			"Harsen",
			"Havering",
			"Hilton",
			"Hobbs",
			"Jackson",
			"Jameson",
			"Jenkins",
			"Johnson",
			"King",
			"Malone",
			"Martin",
			"Mason",
			"Mathewson",
			"Michaels",
			"Miller",
			"Moore",
			"Muller",
			"Nolan",
			"Norris",
			"Parker",
			"Rodriguez",
			"Sawyer",
			"Shoemaker",
			"Smith",
			"Stark",
			"Stevenson",
			"Stone",
			"Thomas",
			"Thompson",
			"Warren",
			"Ward",
			"Wayne",
			"West",
			"White",
			"Young"
		];
	
		function getRandomInt(max) {
			return Math.floor(Math.random() * max);
		};
		
		var TESTVALUES = [];
		var TESTVALUEMAP = {};
        while (TESTVALUES.length < 100){
        	let givenname = GIVENNAMES[getRandomInt(GIVENNAMES.length)];
        	let familyname = FAMILYNAMES[getRandomInt(FAMILYNAMES.length)];
        	let key = givenname + familyname;
        	if(TESTVALUEMAP[key] == undefined){
        		TESTVALUEMAP[key] = "";        	
		        TESTVALUES.push({
		            name : givenname + " " + familyname,
		            value : {givenname : givenname, familyname: familyname}
		        });
        	}
        } 
        
        TESTVALUEMAP = undefined;
        
        console.log(TESTVALUES);
        
        function testSearch(aValue, aCallback) {
        	console.log("testSearch:", aValue);
        	var value = aValue.toLowerCase().split(" ").filter(function(a){return a.length > 0;});
        	var results = [];
        	for(let i = 0; i < TESTVALUES.length &&  results.length < 20; i++){
        		let item = TESTVALUES[i];
        		
        		if(acceptQuery(value,item.name))
        			results.push(item);        		
        	}
        	console.log("testSearchStringsOnly:", results);
	        aCallback(results)
        };
        
        function acceptQuery(aQueries, aValue){
        	for(let i = 0; i < aQueries.length; i++)
        		if(aValue.toLowerCase().search(aQueries[i].trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))  < 0)
        			return false;
        	
        	return true;
        };
        
        function testSearchStringsOnly(aValue, aCallback) {
        	console.log("testSearchStringsOnly:", aValue);
        	var value = aValue.toLowerCase().split(" ").filter(function(a){return a.length > 0;});
        	var results = [];
        	for(let i = 0; i < TESTVALUES.length &&  results.length < 20; i++){
        		let item = TESTVALUES[i];
        		if(acceptQuery(value,item.name))
        			results.push(item.name);    		
        	}        	
        	console.log("testSearchStringsOnly:", results);
	        aCallback(results)
        };
        
        function selectValue(aItem){
        	console.log("select value");
        	console.log(aItem);
        };
        
        function setSelectedValue(){
        	$(".jstl-typeahead").first().de_titus_Typeahead().setSelectedData(TESTVALUES[0]);
        }