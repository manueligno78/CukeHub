const socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('message', function (event) {
  console.log('Received message: ', event.data);
  if (event.data === 'tests started') {
    showLoader();
  } else if (event.data === 'tests finished') {
    hideLoader();
  } else if (JSON.parse(event.data).action === 'reset') {
    console.log('Resetting the page...');
    location.reload();
    document.getElementById('saveButton').style.display = 'none';
    document.getElementById('resetButton').style.display = 'none';
  } else if (JSON.parse(event.data).action === 'featureUpdated') {
    updateFeatureInView(JSON.parse(event.data).featureId, JSON.parse(event.data).field, JSON.parse(event.data).newValue);
    document.getElementById('saveButton').style.display = 'block';
    document.getElementById('resetButton').style.display = 'block';
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
function addTagToInput(tag) {
  // Ottieni l'istanza di DataTables
  var table = $('#dataTable').DataTable();

  // Imposta una funzione di ricerca personalizzata
  table.search(tag);
  table.draw();
}

function addScenarioTagsToInput(tags) {
  tags.forEach(tag => addTagToInput(tag));
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
  if (hsp>127.5) {
    return true;
  } 
  else {
    return false;
  }
}

document.addEventListener('DOMContentLoaded', (event) => {
  document.querySelectorAll('.tag-label').forEach(function(tag) {
    var text = tag.textContent.trim();
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
  if(form) {
    form.addEventListener('submit', function(event) {
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

// $(function() {
//   var taglist = $("#tagsInput").data("tags").split(",");
//   autocompleteInputTags(taglist, "#tagsInput");
// });

$(document).ready( function () {
  $('#dataTable').DataTable();
} );

function updateFeature(featureId, field, newValue) {
  let message = JSON.stringify({
    action: 'updateFeature',
    featureId: featureId,
    field: field,
    newValue: newValue
  });
  socket.send(message);
}

function removeTag(featureId, scenarioId, tag) {
  // Trova la feature o lo scenario con l'ID specificato
  // Rimuovi il tag specificato
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

function reset() {
  let message = JSON.stringify({
    action: 'reset'
  });
  socket.send(message);
}

function confirmReset() {
  var confirmAction = confirm("Are you sure you want to reset your changes?");
  if (confirmAction) {
    reset();
  }
}

function handleTagInputFocus() {
  var input = document.getElementById('addTagInput');
  if (input.innerText === '+ add tag') {
      input.innerText = '';
  }
}

function handleTagInputBlur() {
  var input = document.getElementById('addTagInput');
  if (input.innerText.trim() === '') {
      input.innerText = '+ add tag';
  } else {
      addTag(input.innerText);
  }
}

function handleTagInputKeyDown(event) {
  if (event.key === 'Enter') {
      event.preventDefault();
      var input = document.getElementById('addTagInput');
      if (input.innerText.trim() !== '') {
          addTag(input.innerText);
      }
      input.blur();
  }
}
