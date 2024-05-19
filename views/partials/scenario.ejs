<li>
    <div class="card shadow border-secondary mb-4" id="scenarioCard-<%= featureFile.featureId %>-<%= index %>">
        <div class="card-header py-3">
            <div class="d-flex gap-2 justify-content-center flex-wrap">
                <!-- Tags -->
                <% child.scenario.tags.forEach(function(tag,tagIndex) { %>
                    <span
                        id='tag-<%= tag.name %>-featureCard-<%= featureFile.featureId %>-<%= featureFile.featureId %>-<%= featureFile.feature.children[index].scenario.id %>'
                        class="tag-label badge d-flex p-2 mr-1 mb-1 align-items-center text-primary-emphasis bg-primary-subtle border border-primary-subtle rounded-pill"
                        data-name="<%= tag.name %>">
                        <span contentEditable="true"
                            onblur='updateFeature("<%= featureFile.featureId %>", "feature.children[<%= index %>].scenario.tags[<%= tagIndex %>].name", this.innerText)'
                            class="px-1">
                            <%= tag.name %>
                        </span>
                        <button type="button" class="close" aria-label="Close"
                            onclick="removeTag('<%= featureFile.featureId %>', '<%= featureFile.feature.children[index].scenario.id %>', '<%= tag.name %>','tag-<%= tag.name %>-featureCard-<%= featureFile.featureId %>-<%= featureFile.featureId %>-<%= featureFile.feature.children[index].scenario.id %>')">
                            <span aria-hidden="true">&times;</span></button>
                    </span>
                    <% }); %>
                    <span
                        class="add-tag badge d-flex p-2 align-items-center text-primary-emphasis bg-primary-subtle border border-primary-subtle rounded-pill">
                        <a href="#" class="addTagInput" contentEditable="true" onclick="this.innerText = '@'"
                            onblur="if (isValidTag(this.innerText)) addTag('<%= featureFile.featureId %>', '<%= featureFile.feature.children[index].scenario.id %>', this.innerText, this); else this.innerText = '+ add tag'"
                            onkeydown="if (event.key === 'Enter') { event.preventDefault(); if (isValidTag(this.innerText)) addTag('<%= featureFile.featureId %>', '<%= featureFile.feature.children[index].scenario.id %>', this.innerText, this); else this.innerText = '+ add tag'}">
                            + add tag
                        </a>
                    </span>
            </div>
        </div>
        <div class="card-body">
            <% if (child.scenario.isOutline) { %>
                <span class="small">Outline Scenario</span>
                <% } %>
                    <h5 href="#" contentEditable="true"
                        onblur="updateFeature('<%= featureFile.featureId %>', 'feature.children[' + '<%= index %>' + '].scenario.name', this.innerText)">
                        <%= child.scenario.name %>
                    </h5>
                    <span>
                        <%- child.scenario.numberOfSteps %> steps <% if (child.scenario.isOutline) { %> iterated in <%- child.scenario.numberOfExamples %> examples <% } %>
                    </span>
                    <p contentEditable="true"
                        onblur="updateFeature('<%= featureFile.featureId %>', 'feature.children[' + '<%= index %>' + '].scenario.description', this.innerText)">
                        <% if (child.scenario.description) { %>
                            <%- child.scenario.description.replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;' ) %>
                            <% } else { %>
                                <%- 'No description' %>
                        <% } %>
                    </p>
<%- include('../partials/stepList.ejs', { featureFile: featureFile, child: child, index: index }) %>
</li>