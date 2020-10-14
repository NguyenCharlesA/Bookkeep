// Create Menu for Add-on

function onOpen() {
	SpreadsheetApp.getUi().createMenu('Import Receipt')
		.addItem('Add Receipt', 'showPicker')
		.addItem('Clean Temp Data', 'cleanTemp')
		
		//.addItem('Remove Duplicates', 'removeDupRows')		

		.addToUi();
}

// Required for selecting files (receipts) in Google Drive
function getOAuthToken() {
	DriveApp.getRootFolder();
	return ScriptApp.getOAuthToken();
}

/* 
 * Displays an HTML-service dialog in Google Sheets that contains client-side
 * JavaScript code for the Google Picker API.
 */
function showPicker() {
	var html = HtmlService.createHtmlOutputFromFile('picker.html')
		.setWidth(600)
		.setHeight(425)
		.setSandboxMode(HtmlService.SandboxMode.IFRAME);
	SpreadsheetApp.getUi().showModalDialog(html, 'Import Receipt');
}

function pdfPreview(id, url) {
	addIdAndUrl(id, url);
	var html = HtmlService.createHtmlOutputFromFile('pdfViewer.html')
		.setWidth(850)
		.setHeight(1200)
		.setSandboxMode(HtmlService.SandboxMode.IFRAME);
	SpreadsheetApp.getUi().showModalDialog(html, 'Bookkeep: Update Confirmation');
}

function getOCRText() {
  
	var id = getID();
  
	var pdfReceipt = DriveApp.getFileById(id); 
	var blob = DriveApp.getFileById(id).getBlob();
  
	var resource = {
		title: blob.getName(),
		mimeType: blob.getContentType()
	};    

	var file = Drive.Files.insert(resource, blob, {ocr: true, ocrLanguage: "en"});
	var doc = DocumentApp.openById(file.id);
	var bodyText = doc.getBody().getText();
	Drive.Files.remove(file.id);
	return bodyText;

}


function addIdAndUrl(id, url) {
	var sheet = SpreadsheetApp.getActiveSheet();
	sheet.appendRow([id, url]);
}

/* Currently extracts selected PDF file into a Google Doc into main drive 
 * function returns OCR'ed text
 */

function getID() {
	var sheet = SpreadsheetApp.getActiveSheet();
	var id = sheet.getRange(sheet.getLastRow(), 1).getValue();
	return id;
}

function extractTextFromPDF() {
 
	var sheet = SpreadsheetApp.getActiveSheet();
	var id = sheet.getRange(sheet.getLastRow(), 1).getValue();
	var url = sheet.getRange(sheet.getLastRow(), 2).getValue();

	var pdfReceipt = DriveApp.getFileById(id); 
	var blob = DriveApp.getFileById(id).getBlob();

	/* UrlFetchApp.fetch(url).getBlob();
	blob from URL
	*/
	var resource = {
	title: blob.getName(),
	mimeType: blob.getContentType()
	};

	// create temp file into Google Drive main directory 
	var file = Drive.Files.insert(resource, blob, {ocr: true, ocrLanguage: "en"});

	// Extract text from PDF file
	var doc = DocumentApp.openById(file.id);
	// Returns as string
	var bodyText = doc.getBody().getText();
	// var filename = doc.getName();

	// Receipt Information
	var date = findDate(bodyText);
	var po = findPO(bodyText);
	var vendor = findVendorByWebsite(bodyText);
	var salesOrder = findSalesOrder(bodyText); 
	var cost = findCost(bodyText);
	var link = ''+url;

	// Permanenly remove temp file
	Drive.Files.remove(file.id);

	return [date, po, vendor, salesOrder, cost, link];

	// used for testing
	// var newDoc = createDoc(filename, text);
	// addEntryTest(text);

	//    pdfReceipt.setName(po);
}

function getOCRarray() {
	var i;
	var lastChar;
	var ocrText = getOCRText();
	var ocrArray = [];
	ocrArray = ocrText.split(" ");
	ocrArray = removeDupElements(ocrArray);
	
	for (i = 0; i < ocrArray.length; i++) {
		ocrArray[i] = ocrArray[i].toString();
		ocrArray[i] = ocrArray[i].replace(/\n/, "");
		lastChar = ocrArray[i][ocrArray[i].length -1];
		
		// If matches non-alphanumeric char
		if (lastChar == ":" || lastChar == "," || lastChar == "-" || lastChar == "+" || lastChar == "/") {
			ocrArray[i] = ocrArray[i].replace(ocrArray[i][ocrArray[i].length -1], "")
		}
	}
	return ocrArray;
}

function removeDupElements(arr) {
var seen = {};
	return arr.filter(function(item) {
		return seen.hasOwnProperty(item) ? false : (seen[item] = true);
	});
}

function submitInfo(date, po, vendor, sales, cost, addEntry) {
	var sheet = SpreadsheetApp.getActiveSheet();
	date = date + "";
	po = po + "";
	vendor = vendor + "";
	sales = sales + "";
	cost = cost + "";

	var id = sheet.getRange(sheet.getLastRow(), 1).getValue();
	var link = sheet.getRange(sheet.getLastRow(), 2).getValue();

	var pdfReceipt = DriveApp.getFileById(id);
	pdfReceipt.setName(po);

	sheet.getRange(sheet.getLastRow(),1,sheet.getLastRow(), 7).clear();
	sheet.appendRow([date, po, vendor, sales, cost, link, dateAdded()]);

	if(addEntry == '1') {
		showPicker();
	} else {
		//nothing
	}
}

/* Inserts file into a folder
function insertFileIntoFolder(folderId, fileId) {
	var body = {'id': folderId};
	var request = gapi.client.drive.parents.insert({
		'fileId': fileId,
		'resource': body
	});
	request.execute(function(resp) { });
}
*/
 
// Cleans temp info
function cleanTemp() {
	var sheet = SpreadsheetApp.getActiveSheet();
	var lastRow = sheet.getLastRow();

	var range = sheet.getRange(2,1, sheet.getLastRow(), sheet.getLastColumn());
	range.sort({column: sheet.getLastColumn(), ascending: true});

	var urlRegex = /https:\/\/drive\.google\.com\//i;

	var i;
	var currentRow;
	for (i = 2; i <= lastRow; i++) {
		currentRow = sheet.getRange(i,2).getValue();
		if (currentRow.match(urlRegex) != null) {
			sheet.getRange(i,1,i,7).clear();     
		}
	}  
}

// Get current date and time
function dateAdded() {
	var now = new Date();
	var timeStamp = "" + now.getMonth() + "/" + now.getDate() + "/" + now.getFullYear() + " " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
	return timeStamp;
}

/* Remove duplicate rows from Google Sheets [WIP]
function removeDupRows() {

	var sheet = SpreadsheetApp.getActiveSheet();
  
	// Range
	var startRow = 2;
	var lastRow = sheet.getLastRow();
	var lastColumn = sheet.getLastColumn();

	// Get data
	var range = sheet.getRange(startRow,1,lastRow,lastColumn).getValues();
	var uniqueItems = uniqueArray(range);

	sheet.getRange(startRow,1,sheet.getLastRow(),sheet.getLastColumn()).clear();
	sheet.getRange(startRow,1,uniqueItems.length,lastColumn).setValues(uniqueItems);
    
}

function uniqueArray(arr) {

	var tmp = [];
  
	// Filter out duplicates
	return arr.filter(function(item, index){
  
		// Convert row arrays to string for comparison
		var stringItem = item.toString();
	    
		// Push string item to temporary array
		tmp.push(stringItem);
	    
		// Only return the first occurence of the strings
		return tmp.indexOf(stringItem) >= index;
    
	});
}  
*/

function removeTempInfo(){
	var sheet = SpreadsheetApp.getActiveSheet();
	sheet.getRange(sheet.getLastRow(),1,sheet.getLastRow(), 7).clear();     
}

function removeDupRows() {
	var sheet = SpreadsheetApp.getActiveSheet();
	var data = sheet.getDataRange().getValues();
	var newData = [];    
}
