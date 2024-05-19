<div class="card" id="featureCard-<%= featureFile.featureId %>">
    <div class="card-header d-flex gap-2 justify-content-center flex-wrap">
        <% featureFile.feature.tags.forEach(function(tag,tagIndex) { %>
            <span
                class="tag-label badge d-flex p-2 mr-1 mb-1 align-items-center text-primary-emphasis bg-primary-subtle border border-primary-subtle rounded-pill"
                id="tag-<%= tag.name %>-featureCard-<%= featureFile.featureId %>" data-name="<%= tag.name %>">
                <span contentEditable="true"
                    onblur='updateFeature("<%= featureFile.featureId %>", "feature.tags[<%= tagIndex %>].name", this.innerText)'
                    class="px-1">
                    <%= tag.name %>
                </span>
                <button type="button" class="close" aria-label="Close"
                    onclick="removeTag('<%= featureFile.featureId %>', '<%= featureFile.feature.featureId %>', '<%= tag.name %>','tag-<%= tag.name %>','tag-<%= tag.name %>-featureCard-<%= featureFile.featureId %>')"><span
                        aria-hidden="true">&times;</span></button>
            </span>
            <% }); %>
                <span
                    class="add-tag badge d-flex p-2 align-items-center text-primary-emphasis bg-primary-subtle border border-primary-subtle rounded-pill">
                    <a href="#" class="addTagInput" contentEditable="true" onclick="this.innerText = '@'"
                        onblur="if (isValidTag(this.innerText)) addTag('<%= featureFile.featureId %>', null, this.innerText, this); else this.innerText = '+ add tag'"
                        onkeydown="if (event.key === 'Enter') { event.preventDefault(); if (isValidTag(this.innerText)) addTag('<%= featureFile.featureId %>', null, this.innerText, this); else this.innerText = '+ add tag'}">
                        + add tag
                    </a>
                </span>
    </div>
    <h5 class="card-header" contentEditable="true"
        onblur="updateFeature('<%= featureFile.featureId %>', 'feature.name', this.innerText)">
        <%= featureFile.feature.name %>
    </h5>
    <p class="card-body m-1 py-1 small">
        Located in: <%= featureFile.relativePath %>
    </p>
    <p class="card-body" contentEditable="true"
        onblur="updateFeature('<%= featureFile.featureId %>', 'feature.description', this.innerText)">
        <% if (featureFile.feature.description) { %>
            <%- featureFile.feature.description.replace(/\n/g, '<br>' ).replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;' ) %>
                <% } else { %>
                    <%- 'No description' %>
                        <% } %>
    </p>
</div>