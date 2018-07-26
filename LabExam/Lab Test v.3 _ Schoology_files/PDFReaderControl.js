!function(e){"use strict";e.DesktopReaderControl=e.ReaderControl,e.ReaderControl=function(r){var o=this;this.showFilePicker=r.showFilePicker,this.useDownloader=!!_.isUndefined(r.useDownloader)||!!r.useDownloader,e.DesktopReaderControl.call(this,r),o.fireError=function(e,r){console.warn("Error: "+e),o.fireEvent("error",[e,r])},this.pdfType=r.pdfType,this.initProgress(),this.workerHandlers={workerLoadingProgress:function(e){o.fireEvent("workerLoadingProgress",e)}},this.pdfTypePromise="auto"===this.pdfType?e.CoreControls.getDefaultPdfBackendType():Promise.resolve(this.pdfType),r.preloadWorker&&this.pdfTypePromise.then(function(r){var n="pnacl"!==o.pdfType&&!e.CoreControls.isSubzeroEnabled();e.CoreControls.preloadPDFWorker(r,o.workerHandlers,{useEmscriptenWhileLoading:n,autoSwap:!1})}),this.filename="downloaded.pdf";var n,t,s,a,i,d;o.getPassword=function(e){i=o.passwordTries>=3,d=!1,0===o.passwordTries?(n=$("<div>").attr({id:"passwordDialog"}),a=$('<div style="color:red"></div>').appendTo(n),s=$("<label>").attr({"for":"passwordInput"}).text("Enter the document password:").appendTo(n),t=$("<input>").attr({type:"password",id:"passwordInput"}).keypress(function(e){13===e.which&&$(this).parent().next().find("#pass_ok_button").click()}).appendTo(n),n.dialog({modal:!0,resizable:!1,closeOnEscape:!1,close:function(){d||o.fireError("The document requires a valid password.",i18n.t("error.EncryptedUserCancelled"))},buttons:{OK:{click:function(){i||(d=!0,e(t.val())),$(this).dialog("close")},id:"pass_ok_button",text:"OK"},Cancel:function(){$(this).dialog("close")}}})):i?o.fireError("The document requires a valid password.",i18n.t("error.EncryptedAttemptsExceeded")):(t.val(""),a.text("The Password is incorrect. Please make sure that Caps lock is not on by mistake, and try again."),n.dialog("open")),++o.passwordTries},o.onDocError=function(e){e.stack&&console.log(e.stack),o.fireError(e.message,i18n.t("error.PDFLoadError"))}},e.ReaderControl.prototype={MAX_ZOOM:10,MIN_ZOOM:.05,printFactor:96/72,initUI:function(){var r=this;e.DesktopReaderControl.prototype.initUI.call(this);var o=$("<span></span>").addClass("glyphicons disk_save").attr({id:"downloadButton","data-i18n":"[title]controlbar.download"}).i18n(),n=$("#printButton").parent();if(n.append(o),this.showFilePicker){var t=$('<label for="input-pdf" class="file-upload glyphicons folder_open"></label><input id="input-pdf"  accept=".pdf,.png,.jpg,.jpeg" type="file" class="input-pdf">').attr("data-i18n","[title]controlbar.open").i18n();n.append(t),t.on("change",r.listener.bind(r));var s=document.getElementById("ui-display");s.addEventListener("dragover",function(e){e.stopPropagation(),e.preventDefault(),e.dataTransfer.dropEffect="copy"}),s.addEventListener("drop",function(e){e.stopPropagation(),e.preventDefault();var o=e.dataTransfer.files,n=o[0];!n||"application/pdf"!==n.type&&"image/jpeg"!==n.type&&"image/png"!==n.type||r.loadLocalFile(n,{filename:r.parseFileName(n.name)})})}r.saveInProgress=!1,$("#downloadButton").on("click",function(){r.downloadFile()})},downloadFile:function(r){var o=this,n=o.docViewer.getDocument();if(!o.saveInProgress&&n){this.toolModeMap[e.PDFTron.WebViewer.ToolMode.AnnotationCreateFreeHand].complete(),o.saveInProgress=!0,o.saveCancelled=!1;var t=$("#downloadButton");t.removeClass("disk_save"),t.addClass("refresh"),t.addClass("rotate-icon");var s=function(){o.saveInProgress=!1,t.removeClass("refresh"),t.removeClass("rotate-icon"),t.addClass("disk_save")},a=o.docViewer.getAnnotationManager(),i={xfdfString:r||a.exportAnnotations()};o.saveCancelled||n.getFileData(i).then(function(e){if(s(),!o.saveCancelled){var r=new Uint8Array(e),n=new Blob([r],{type:"application/pdf"});saveAs(n,o.getDownloadFilename(o.filename)),o.fireEvent("finishedSavingPDF")}},function(e){if(s(),!e||!e.type||"Cancelled"!==e.type)throw new Error(e.message);console.log("Save operation was cancelled")})}},getDownloadFilename:function(e){return e&&".pdf"!==e.slice(-4).toLowerCase()&&(e+=".pdf"),e},loadDocumentConfirm:function(){var e=this;return new Promise(function(r,o){if(!e.saveInProgress)return void r();var n=$("<div>").attr({id:"loadConfirmDialog"}),t=$("<label>").text("Are you sure you want to cancel the current document download and load the new document?").appendTo(n),s=function(){d=!0,t.text("Download Complete. Continuing to new document."),n.dialog("option","buttons",{OK:i})},a=function(){$(document).off("finishedSavingPDF",s)};$(document).on("finishedSavingPDF",s);var i={click:function(){r(),$(this).dialog("close")},id:"load_ok_button",text:"OK"},d=!1;n.dialog({modal:!0,resizable:!1,closeOnEscape:!1,close:function(){a(),o("The load operation was cancelled"),$(this).dialog("close")},buttons:{OK:i,Cancel:function(){a(),o("The load operation was cancelled"),$(this).dialog("close")}}})})},loadDocument:function(e,r){var o=this;this.loadDocumentConfirm().then(function(){o.showProgress(),o.closeDocument(),o.saveCancelled=!0,o.printCancelled=!0;var n=new CoreControls.PartRetrievers.ExternalPdfPartRetriever(e,{useDownloader:o.useDownloader,withCredentials:r&&r.withCredentials});r&&r.customHeaders&&n.setCustomHeaders(r.customHeaders),r&&r.filename?o.filename=r.filename:o.filename=o.parseFileName(e),n.on("documentLoadingProgress",function(e,r,n){o.fireEvent("documentLoadingProgress",[r,n])}),n.on("error",function(e,r,n){o.fireEvent("error",[n,i18n.t("error.load")+": "+n])}),o.loadAsync(o.docId,n,r&&r.workerTransportPromise)},function(){})},loadLocalFile:function(e,r){var o=this;this.loadDocumentConfirm().then(function(){o.showProgress(),o.closeDocument(),o.saveCancelled=!0,o.printCancelled=!0;var n=new CoreControls.PartRetrievers.LocalPdfPartRetriever(e);n.on("documentLoadingProgress",function(e,r,n){o.fireEvent("documentLoadingProgress",[r,n])}),o.loadAsync(window.readerControl.docId,n,r.workerTransportPromise),r.filename&&(o.filename=r.filename)},function(){})},loadAsync:function(e,r,o){var n=this,t=["pdf","jpg","jpeg","png"];this.pdfTypePromise.then(function(s){var a="pdf",i=n.filename;if(i){var d=i.lastIndexOf(".");if(d!==-1)for(var l=i.slice(d+1).toLowerCase()||"pdf",p=0;p<t.length;++p)if(0===l.indexOf(t[p])){a=t[p];break}}var c={type:"pdf",docId:e,extension:a,getPassword:n.getPassword,onError:n.onDocError,pdfBackendType:s,workerHandlers:n.workerHandlers};o||(o=CoreControls.initPDFWorkerTransports(s,n.workerHandlers,window.parent.WebViewer?window.parent.WebViewer.l():void 0)),o["catch"](function(e){n.fireError(e.message,i18n.t(e.userMessage))}),c.workerTransportPromise=o,n.docViewer.setRenderBatchSize(2),n.docViewer.setViewportRenderMode(!0),n.passwordTries=0,n.hasBeenClosed=!1,n.docViewer.loadAsync(r,c)})},initProgress:function(){var e=this;this.$progressBar=$('<div id="pdf-progress-bar"><div class="progress-text"></div><div class="progress-bar"><div style="width:0%">&nbsp;</div><span>&nbsp;</span></div></div>'),$("body").append(this.$progressBar);var r=new $.Deferred,o=new $.Deferred;this.$progressBar.find(".progress-text").text(i18n.t("Initializing")),this.$progressBar.find(".progress-bar div").css({width:"100%"}),$(document).on("workerLoadingProgress",function(o,n){var t=e.$progressBar.hasClass("document-failed"),s=Math.round(100*n),a=n>=1&&!t;s>0&&!t&&!a&&e.$progressBar.find(".progress-text").text(i18n.t("initialize.pnacl")+s+"%"),e.$progressBar.find(".progress-bar div").css({width:s+"%"}),n>=1&&!t&&(r.resolve(),e.$progressBar.find(".progress-text").text(i18n.t("Initializing")+" "+s+"%"))}).on("documentLoadingProgress",function(n,t,s){var a=-1;if(s>0&&(a=Math.round(t/s*100)),"pending"!==r.state()||!e.$progressBar.hasClass("document-failed"))if(a>=0)e.$progressBar.hasClass("document-failed")||e.$progressBar.find(".progress-text").text(i18n.t("initialize.loadDocument")+a+"%"),e.$progressBar.find(".progress-bar div").css({width:a+"%"});else{var i=Math.round(t/1024);e.$progressBar.hasClass("document-failed")||(e.$progressBar.find(".progress-text").text(i18n.t("initialize.loadDocument")+i+"KB"),e.$progressBar.find(".progress-bar div").css({width:"100%"}))}t===s&&o.resolve()}),$(document).on("documentLoaded",function(){e.$progressBar.hasClass("document-failed")||(e.$progressBar.fadeOut(),clearTimeout(e.initialProgressTimeout))}),this.onError=function(r,o,n){e.$progressBar.find(".progress-text").text(n),e.$progressBar.addClass("document-failed"),e.$progressBar.show(),clearTimeout(e.initialProgressTimeout)},e.$progressBar.hide()},showProgress:function(){var e=this;this.$progressBar.hide(),this.initialProgressTimeout=setTimeout(function(){e.$progressBar.fadeIn("slow"),e.$progressBar.removeClass("document-failed")},2e3)},parseFileName:function(e){var r=e.indexOf("\\")>=0?e.lastIndexOf("\\"):e.lastIndexOf("/"),o=e.substring(r);return 0===o.indexOf("\\")||0===o.indexOf("/")?o.substring(1):o},printHandler:function(){var r=this;r.passwordTries?e.DesktopReaderControl.prototype.printHandler.call(r):e.isPDFiumSupported().then(function(o){if(o){var n=r.docViewer.getDocument();if(!n||r.printInProgress)return;var t=$("#printButton");r.printInProgress=!0,r.printCancelled=!1,t.removeClass("print"),t.addClass("refresh"),t.addClass("rotate-icon");var s=function(){r.printInProgress=!1,t.removeClass("refresh"),t.removeClass("rotate-icon"),t.addClass("print")},a=r.docViewer.getAnnotationManager(),i={xfdfString:a.exportAnnotations(),printDocument:!0};r.printCancelled||n.getFileData(i).then(function(o){if(s(),console.log("Print check"),!r.printCancelled){var n=new Uint8Array(o),t=new Blob([n],{type:"application/pdf"});console.log("Finished printing"),e.pdfiumPrint(t)}},function(){s(),console.log("Print Cancelled"),r.printCancelled||e.DesktopReaderControl.prototype.printHandler.call(r)})}else e.DesktopReaderControl.prototype.printHandler.call(r)})},listener:function(e){var r=e.target.files;0!==r.length&&this.loadLocalFile(r[0],{filename:this.parseFileName(document.getElementById("input-pdf").value)})},closeDocument:function(){e.DesktopReaderControl.prototype.closeDocument.call(this),this.$progressBar.removeClass("document-failed"),this.$progressBar.hide()}},e.ReaderControl.prototype=$.extend({},e.DesktopReaderControl.prototype,e.ReaderControl.prototype)}(window),$("#slider").addClass("hidden-lg"),$("#searchControl").parent().addClass("hidden-md"),$("#control").css("min-width",690),$("head").append($('<link rel="stylesheet" type="text/css" />').attr("href","pdf/PDFReaderControl.css"));