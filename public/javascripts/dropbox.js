function Dropbox(dropbox, url) {
  this.box = dropbox;
  this.url = url;
  this.queue = [];
  this.num_current_uploads = 0;
 
  // Add clickable file picker
  this.picker = document.createElement('input');
  this.picker.setAttribute('type', 'file');
  this.picker.setAttribute('style', 'visibility:hidden; position:absolute');
  this.box.parentNode.insertBefore(this.picker, this.box.nextSibling);
  // Add progress bar container
  this.uploads = document.createElement('div');
  this.box.parentNode.insertBefore(this.uploads, this.box.nextSibling);
 
  // Optional defaults
  this.max_concurrent = 25; // Queue uploads after n concurrent
  this.max_size = null; // Max size in MB
  this.success = null; // Callback on successful upload, passed the response body
  this.error = null; // Callback on upload failure, passed the error text
 
  var _this = this;
  // Init drag and drop handlers
  this.box.addEventListener("dragenter", function(e) { _this.drag(e, true) }, false);
  this.box.addEventListener("dragleave", function(e) { _this.drag(e, false) }, false);
  this.box.addEventListener("dragover", noop, false);
  this.box.addEventListener("drop", function(e) { _this.drop(e) }, false);
  // Init file picker handlers
  this.box.addEventListener("click", function(e) { noop(e); _this.picker.click() })
  this.picker.addEventListener("change", function(e) { _this.drop(e) })
}
 
Dropbox.prototype.drop = function(e) {
  this.drag(e, false);
  var files = (e.dataTransfer || e.target).files;
  for ( var i=0; i<files.length; i++ )
    this.handle_file(files[i]);
}
 
Dropbox.prototype.drag = function(e, active) {
  noop(e);
  this.box.className = active ? this.box.className += ' active' : this.box.className.replace(/ ?active/, '');
}
 
Dropbox.prototype.handle_file = function(file) {
  // Too large
  if ( this.max_size && (file.size / 1024 / 1024) > this.max_size ) {
    alert(file.name + ' is too large; maximum is ' + this.max_size.toFixed(2) + ' MB');
  } else {
    file.label = this.add_label(file);
    // Enqueue it
    if ( this.max_concurrent > -1 && this.num_current_uploads >= this.max_concurrent )
      this.queue.push(file);
    // Upload it
    else this.process_file(file);
  }
}
 
Dropbox.prototype.process_file = function(file) {
  this.num_current_uploads += 1;
  var _this = this;
  var reader = new FileReader();
  reader.onload = function(e) {
    var file_contents = e.target.result.split(',')[1];
    _this.upload_file(file, file_contents);
  }
  reader.readAsDataURL(file);
}
 
Dropbox.prototype.upload_file = function(file, file_contents) {
  // Build form
  var data = new FormData();
  data.append('filename', file.name);
  data.append('mimetype', file.type);
  data.append('data', file_contents);
  data.append('size', file.size);
 
  var _this = this;
  var xhr = new XMLHttpRequest();
  // Update progress bar (if available)
  if ( xhr.upload ) xhr.upload.addEventListener('progress', function(e) { _this.handle_upload_progress(e, file.label) }, false)
  xhr.open('POST', this.url);
  xhr.onreadystatechange = function(e) {
    if ( xhr.readyState === 4 ) {
      // Success
      if (xhr.status === 200) {
        file.label.getElementsByTagName('span')[0].innerHTML = '100%';
        if ( _this.success ) _this.success(file, xhr.responseText);
      // Error
      } else {
        file.label.getElementsByTagName('span')[0].innerHTML = 'Error';
        if ( _this.error ) _this.error(file, xhr.statusText);
      }
      // Pop next upload off the queue
      _this.num_current_uploads -= 1;
      if ( _this.queue.length > 0 ) _this.process_file(_this.queue.shift())
      // Remove the label in 1 second
      setTimeout(function() { _this.uploads.removeChild(file.label) }, 1000);
    }
  }
  xhr.send(data)
}
 
Dropbox.prototype.handle_upload_progress = function(e, label) {
  if ( e.lengthComputable ) {
    var progress = label.getElementsByTagName('progress')[0];
    progress.setAttribute('value', e.loaded);
    progress.setAttribute('max', e.total);
    label.getElementsByTagName('span')[0].innerHTML = ((e.loaded / e.total) * 100).toFixed(0) + '%';
  }
}
 
Dropbox.prototype.add_label = function(file) {
  var size = (file.size / 1024 / 1024).toFixed(2);
  var label = document.createElement('div');
	label.setAttribute("id", "prog");
  label.innerHTML = '<progress value="0" max="100"></progress> ' + file.name + ' - <span>0%</span> / ' + size + ' MB';
  this.uploads.insertBefore(label, null);
  return label;
}
 
function noop(e) {
  e.stopPropagation();
  e.preventDefault();
}