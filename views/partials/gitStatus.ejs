<div class="container mt-5">
    <a class="nav-link px-0" href="#" onclick="confirmReset()">
        <i class="fas fa-fw fa-stream"></i>
        <span>Changed:</span></a>
    <ul id="gitStatusTable" class="list-group small">
    </ul>
    <ul class="px-0">
        <!-- Nav Item - Commit -->
        <li class="nav-item" id="commitButton" style="display: block;">
            <a class="nav-link px-0" href="#" onclick="confirmCommit()" title="Commit current changes">
                <i class="fas fa-fw fa-save"></i>
                <span>Commit</span></a>
        </li>
        <!-- Nav Item - Revert -->
        <li class="nav-item" id="revertButton" style="display: block;">
            <a class="nav-link px-0" href="#" onclick="confirmRevert()">
                <i class="fas fa-fw fa-undo"></i>
                <span>Revert changes</span></a>
        </li>
    </ul>
</div>

<script>
    function updateGitStatusTable(gitStatus) {

        console.log('updateGitStatusTable', JSON.stringify(gitStatus));

        console.log('updateGitStatusTable', JSON.stringify(gitStatus));
        var gitStatusTable = document.getElementById('gitStatusTable');
        if (gitStatus.files.length > 0) {
            document.getElementById('commitButton').style.display = 'block';
            document.getElementById('revertButton').style.display = 'block';
            gitStatusTable.innerHTML = '';
            for (var file of gitStatus.files) {
                var li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = file.path;
                var badge = document.createElement('span');
                badge.className = 'badge badge-primary badge-pill';
                badge.innerHTML = file.working_dir;
                li.appendChild(badge);
                gitStatusTable.appendChild(li);
            }
        }
        else {
            document.getElementById('commitButton').style.display = 'none';
            document.getElementById('revertButton').style.display = 'none';
            gitStatusTable.innerHTML = '<li class="list-group-item">No changes</li>';
            if (gitStatus.files.length > 0) {
                document.getElementById('commitButton').style.display = 'block';
                document.getElementById('revertButton').style.display = 'block';
                gitStatusTable.innerHTML = '';
                for (var file of gitStatus.files) {
                    var li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center';
                    li.innerHTML = file.path;
                    var badge = document.createElement('span');
                    badge.className = 'badge badge-primary badge-pill';
                    badge.innerHTML = file.working_dir;
                    li.appendChild(badge);
                    gitStatusTable.appendChild(li);
                }
            }
            else {
                document.getElementById('commitButton').style.display = 'none';
                document.getElementById('revertButton').style.display = 'none';
                gitStatusTable.innerHTML = '<li class="list-group-item">No changes</li>';
            }
        }
    }
</script>