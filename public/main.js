const socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('message', function (event) {
  if (JSON.parse(event.data).action === 'reset') {
    console.log('Resetting the page...');
    location.reload();
  } else if (JSON.parse(event.data).action === 'featureUpdated') {
    location.reload();
  } else if (JSON.parse(event.data).action === 'gitStatus') {
    var gitStatus = JSON.parse(event.data).message;
    updateGitStatusTable(gitStatus);
  } else if (JSON.parse(event.data).action === 'revert') {
    reset();
  }
});

socket.addEventListener('open', function (event) {
  console.log('WebSocket is open now.');
});

socket.addEventListener('error', function (event) {
  console.log('WebSocket error: ', event);
});

socket.addEventListener('close', function (event) {
  console.log('WebSocket is closed now.');
});

function updateFeatureInView(featureId, field, newValue) {
  var row = document.getElementById(featureId);
  if (row) {
    var cell = row.getElementsByClassName(field)[0];
    if (cell) {
      cell.textContent = newValue;
      cell.classList.add('content-updated');
    }
  }
}

function hideLoader() {
  document.getElementById('tagsInput').classList.remove('disabled');
  document.getElementById('run-test-button').classList.remove('disabled');
}

function showLoader() {
  document.getElementById('tagsInput').classList.add('disabled');
  document.getElementById('run-test-button').classList.add('disabled');
}
function addTagToDataTableSearchInput(tag) {
  // Ottieni l'istanza di DataTables
  var table = $('#dataTable').DataTable();

  // Imposta una funzione di ricerca personalizzata
  table.search(tag);
  table.draw();
}

function addScenarioTagsToInput(tags) {
  tags.forEach(tag => addTagToDataTableSearchInput(tag));
}

document.querySelectorAll('.scenario-link').forEach(link => {
  link.addEventListener('click', function (event) {
    event.preventDefault();
    const tags = JSON.parse(this.getAttribute('data-tags'));
    addScenarioTagsToInput(tags);
  });
});

function hashCode(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  return hash;
}

function intToRGB(i) {
  var c = (i & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();
  return "00000".substring(0, 6 - c.length) + c;
}

function autocompleteInputTags(taglist, tagInputId) {
  $(tagInputId).autocomplete({
    source: taglist
  });
}

function isLightColor(color) {
  var r, g, b, hsp;
  color = +("0x" + color.slice(1).replace(
    color.length < 5 && /./g, '$&$&'));
  r = color >> 16;
  g = color >> 8 & 255;
  b = color & 255;
  hsp = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
  );
  if (hsp > 127.5) {
    return true;
  }
  else {
    return false;
  }
}

document.addEventListener('DOMContentLoaded', (event) => {
  document.querySelectorAll('.tag-label').forEach(function (tag) {
    var text = tag.attributes['data-name'].value;
    var hash = hashCode(text);
    var color = intToRGB(hash);
    tag.style.backgroundColor = "#" + color;
    if (isLightColor(color)) {
      tag.style.color = 'black';
    } else {
      tag.style.color = 'white';
    }
  });


  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const tags = document.querySelector('#tagsInput').value;
      const operator = document.querySelector('#operatorSelect').value;
      const message = {
        action: 'run-tests',
        tags: tags,
        mode: 'tagExecution'
      };
      console.log('Sending message: ', message);
      socket.send(JSON.stringify(message));
    });
  }
});

function isValidTag(tag) {
  // A tag is valid if it is a string, it is not empty and it does not contain spaces and starts with @ and length > 2
  return typeof tag === 'string' && tag.trim() !== '' && !tag.includes(' ') && tag.startsWith('@') && tag.length > 2;
}

$(document).ready(function () {
  $('#dataTable').DataTable();
  let message = JSON.stringify({
    action: 'gitStatus'
  });
  socket.send(message);
});

function updateFeature(featureId, field, newValue) {
  let message = JSON.stringify({
    action: 'updateFeature',
    featureId: featureId,
    field: field,
    newValue: newValue
  });
  socket.send(message);
}

function removeTag(featureId, scenarioId, tag, id) {
  let message = JSON.stringify({
    action: 'removeTag',
    featureId: featureId,
    scenarioId: scenarioId,
    tag: tag
  });
  socket.send(message);
  document.getElementById(id).remove();
}

function addTag(featureId, scenarioId, tag, caller) {
  let message = JSON.stringify({
    action: 'addTag',
    featureId: featureId,
    scenarioId: scenarioId,
    tag: tag
  });
  socket.send(message);
}

function updateAllOccurencyOfTag(tag, newTag) {
  let message = JSON.stringify({
    action: 'updateAllOccurencyOfTag',
    tag: tag,
    newTag: newTag
  });
  socket.send(message);
}

function deleteAllOccurencyOfTag(tag) {
  let message = JSON.stringify({
    action: 'deleteAllOccurencyOfTag',
    tag: tag
  });
  socket.send(message);
}

function saveOnDisk() {
  let message = JSON.stringify({
    action: 'saveOnDisk'
  });
  socket.send(message);
}

function confirmExport() {
  var confirmAction = confirm("Are you sure you want to export?");
  if (confirmAction) {
    saveOnDisk();
  }
}

function confirmReset() {
  var confirmAction = confirm("Are you sure you want to reset your changes?");
  if (confirmAction) {
    reset();
  }
}

function confirmCommit() {
  var confirmAction = confirm("Are you sure you want to commit current changes?");
  if (confirmAction) {
    commit();
  }
}

function confirmRevert() {
  var confirmAction = confirm("Are you sure you want to revert current changes?");
  if (confirmAction) {
    revert();
  }
}

function reset() {
  let message = JSON.stringify({
    action: 'reset'
  });
  socket.send(message);
  //send message "gitStutus" to update the git status table
  message = JSON.stringify({
    action: 'gitStatus'
  });
  socket.send(message);
}

function commit() {
  let message = JSON.stringify({
    action: 'commit'
  });
  socket.send(message);
}

function revert() {
  let message = JSON.stringify({
    action: 'revert'
  });
  socket.send(message);
}

