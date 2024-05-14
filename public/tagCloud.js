$(document).ready(function () {
    sortAndShowTags();
});

function sortAndShowTags() {
    var isChecked = document.getElementById('showAllTags').checked;
    var container = document.getElementById('tagCloud');
    var tags = Array.from(container.getElementsByClassName('tag-label'));
    if (document.getElementById('sortCheckbox').checked) {
        document.getElementById('sortCheckboxLabel').innerText = 'Switch to alphabetical sorting';
        tags.sort(function (a, b) {
            return b.getAttribute('data-count') - a.getAttribute('data-count');
        });
    } else {
        document.getElementById('sortCheckboxLabel').innerText = 'Switch to frequency sorting';
        tags.sort(function (a, b) {
            return a.textContent.localeCompare(b.textContent);
        });
    }
    tags.forEach(function (tag, index) {
        tag.style.order = index;
    });
    for (var i = 0; i < tags.length; i++) {
        tags[i].style.display = isChecked || i < 10 ? 'block' : 'none';
    }

    isChecked ? document.getElementById('sortCheckboxContainer').style.display = 'block' : document.getElementById('sortCheckboxContainer').style.display = 'none';
}
