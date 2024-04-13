const socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('message', function (event) {
  console.log('Received message: ', event.data);
  var messages = document.getElementById('messages');
  try {
    const data = JSON.parse(event.data);
    if (typeof data === 'object') {
      messages.textContent += JSON.stringify(data, null, 2) + '\n';
    } else {
      messages.textContent += data + '\n';
    }
  } catch (error) {
    messages.textContent += event.data + '\n';
  }
  if (event.data === 'tests started') {
    showLoader();
  } else if (event.data === 'tests finished') {
    hideLoader();
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

function hideLoader() {
  document.getElementById('tagsInput').classList.remove('disabled');
  document.getElementById('run-test-button').classList.remove('disabled');
}

function showLoader() {
  document.getElementById('tagsInput').classList.add('disabled');
  document.getElementById('run-test-button').classList.add('disabled');
}

function addTagToInput(tag) {
  const input = document.getElementById('tagsInput');
  const operatorSelect = document.getElementById('operatorSelect');
  const operator = operatorSelect.value === 'AND' ? 'and' : 'or';
  input.value = input.value ? `${input.value} ${operator} ${tag}` : tag;
}

function addScenarioTagsToInput(tags) {
  tags.forEach(tag => addTagToInput(tag));
}

function hashCode(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var color = '#';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
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

$(function() {
  var taglist = $("#tagsInput").data("tags").split(",");
  autocompleteInputTags(taglist, "#tagsInput");
});

$(document).ready(function() {
    $('#table').DataTable({
    order: [[ 0, 'asc' ]],
    columns: [
        { width: "30%" },
        { width: "20%" },
        { width: "50%" }
    ]
});
});
