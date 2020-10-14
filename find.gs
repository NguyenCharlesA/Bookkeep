// find.gs contains functions for finding receipt values based on regular expressions

// Find PO Number
function findPO(body) {
	var po_regex = /(po|p0)[#\-]{0,1}\s{0,1}\d{2}[\s-]{0,1}\d{4}/i;
  
	// Find 'po_num' regex match in body 
	var found = body.match(po_regex);
  
	// Add po_num to Google sheet
	var po_num = ""+found;

	/* --- WILL NEED TO GO BACK TO FIX THIS
	* Removes ',PO'at the end of po_num
	*/
	po_num = po_num.replace(/[,\/]P0/, "");

	return po_num;
}

function findVendorByWebsite(body) {
	// Regex
	var vendorRegex = /[\w\-]{0,25}\.com/i;
	var foundVendor = body.match(vendorRegex);
	var vendor = "" + foundVendor;

	vendor = vendor.replace(/.com/i, "");
	vendor = vendor.toUpperCase();

	return vendor;
}

function findSalesOrder(body) {
	var foundSales = '';
	var apple = body.match(/apple/i);

	if (apple) {
		var so_regex = /(10)[0-9]{8}/;
		var foundSales = body.match(so_regex);

		foundSales = ""+foundSales;
		foundSales = foundSales.replace(/\,(.*)/, "");
	}
  
	return foundSales;
}

function findDate(body) {
	// REGEX DATES --- will need to add more variations

	// MM/DD/YYYY, MM/DD/YY, MM-DD-YYYY, or MM-DD-YY
	var date2_regex = /(([1-9])|(0[1-9])|(1[0-2]))[(\/)|-](([1-9])|(0[1-9])|([1-2][0-9])|(3[0-1]))[(\/)|-]((20[0-9]{2})|([0-9]{2}))/i;
  
	// YYYY/MM/DD, YY/MM/DD, YYYY-MM-DD, or YY-DD-YY
	var date1_regex = /((20[0-9]{2})|([0-9]{2}))[(\/)|-](([1-9])|(0[1-9])|([1-2][0-9])|(3[0-1]))[(\/)|-]((20[0-9]{2})|([0-9]{2}))/i;
  
	var found_date1 = body.match(date1_regex);
	var found_date2 = body.match(date2_regex);

	var date;
	if (found_date1 != null) {
		date = found_date1;
	} else if (found_date2 != null) {
		date = found_date2;
	} else {
		date = null;
	}
	date = ""+ date;

	// Removes anything from ',' and after
	date = date.replace(/\,(.*)/, "");

	return date;
}

function findCost(body) {
	// REGEX
	var cost_regex = /(\d+\.\d{1,2})/i;

	// Find 'cost' regex match in body 
	var found_cost = body.match(cost_regex);

	var cost = ""+found_cost;

	// Removes anything from ',' and after
	cost = cost.replace(/\,(.*)/, "");

	var format_cost = formatCost(cost);
	return format_cost;
}

function formatCost(tempValue) {
	return "$"+tempValue;//Utilities.formatString("$%d,%03d,%02d%1.2f", tempValue/1000, tempValue/1000, tempValue%1000/10,tempValue%10);
}

