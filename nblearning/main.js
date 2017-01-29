define([
    'require',
    'jquery',
    'base/js/namespace',
    'base/js/dialog',
    'notebook/js/celltoolbar',
    'base/js/events',
    '../nbcelltesting/main'
], function (require,
             $,
             Jupyter,
             dialog,
             notebook_celltoolbar,
             events,
             nbcelltesting) {

    var preset_name = 'Learning';

    var CellToolbar = notebook_celltoolbar.CellToolbar;

    var keywords_data = {};

    var showing_solution = {};


    events.on('change.Cell', function(event, data) {
        cell = data.cell;
        cell.celltoolbar.rebuild();
    });


    var keywords_to_text = function(keywords) {
        var parts = [];
        for (var keyword of keywords) {
            parts.push(keyword.name + ', ' + keyword.max);
        }
        return parts.join('\n');
    };


    var text_to_keywords = function(text) {
        var keywords = [];
        parts = text.split('\n');
        for (var part of parts) {
            part = part.trim();
            if (!part) { continue; }
            s = part.split(',');
            if (s.length === 1) {
                name = s[0].trim();
                max = 1;
            } else if (s.length === 2) {
                name = s[0].trim();
                max = parseInt(s[1]);
            } else {
                throw new SyntaxError('Cannot convert to keywords.');
            }
            keywords.push({name: name, max: max});
        }
        return keywords;
    };


    var edit_keywords = function(cell, celltoolbar) {
        var keywords = [];
        if (cell.metadata.nblearning !== undefined &&
            cell.metadata.nblearning.keywords !== undefined) {
            keywords = cell.metadata.nblearning.keywords;
        }
        var keywords_text = keywords_to_text(keywords);

        var notebook = Jupyter.notebook;
        var error_div = $('<div/>').css('color', 'red');
        var message = 'Edit the keywords the cell.';

        var textarea = $('<textarea/>')
            .attr('rows', '13')
            .attr('cols', '80')
            .attr('name', 'keywords')
            .text(keywords_text);

        var dialogform = $('<div/>').attr('title', 'Edit Keywords')
            .append(
                $('<form/>').append(
                    $('<fieldset/>').append(
                        $('<label/>')
                        .attr('for','keywords')
                        .text(message)
                        )
                        .append(error_div)
                        .append($('<br/>'))
                        .append(textarea)
                    )
            );

        var editor = CodeMirror.fromTextArea(textarea[0], {
            lineNumbers: true,
            matchBrackets: true,
            indentUnit: 2,
            autoIndent: true,
            mode: 'text/plain',
        });

        var modal_obj = dialog.modal({
            title: 'Edit Keywords',
            body: dialogform,
            buttons: {
                OK: { class : "btn-primary",
                    click: function() {
                        var new_keywords;
                        try {
                            new_keywords = text_to_keywords(editor.getValue());
                        } catch(e) {
                            console.log(e);
                            error_div.text('WARNING: Could not save invalid keywords.');
                            return false;
                        }
                        if (cell.metadata.nblearning === undefined) {
                            cell.metadata.nblearning = {};
                        }
                        cell.metadata.nblearning.keywords = new_keywords;
                        celltoolbar.rebuild();
                    }
                },
                Cancel: {}
            },
            notebook: notebook,
            keyboard_manager: notebook.keyboard_manager,
        });

        modal_obj.on('shown.bs.modal', function(){ editor.refresh(); });
    };


    var create_button_edit_keywords = nbcelltesting.create_button('edit', 'Edit Keywords',
                                                                  edit_keywords);


    var count_occurrences = function(text, str) {
        for (var count=-1, index=0;
             index != -1;
             count++, index=text.indexOf(str, index + 1));
        return count;
    }


    var update_keyword_counts = function(cell) {
        var text = cell.get_text();
        var new_keywords_data = [];
        for (var keyword of keywords_data[cell]) {
            var count = count_occurrences(text, keyword.name);
            keyword.count = count;
            new_keywords_data.push(keyword);
        }
        keywords_data[cell] = new_keywords_data;
    };


    var prepare_keywords = function(cell) {
        keywords_data[cell] = [];

        if (cell.metadata.nblearning !== undefined &&
            cell.metadata.nblearning.keywords !== undefined) {
            keywords_data[cell] = cell.metadata.nblearning.keywords;
        }

        update_keyword_counts(cell);
    };


    var create_keywords_div = function(cell) {
        var div = $('<div/>').addClass('keywords');
        for (var keyword of keywords_data[cell]) {
            var button = $('<button/>')
                .addClass('btn btn-default btn-xs')
                .prop('type', 'button')
                .html(keyword.name);
            if (keyword.count == keyword.max) {
                button.addClass('btn-success');
            } else if (keyword.count > keyword.max) {
                button.addClass('btn-danger');
            } else {
                button.addClass('btn-primary');
            }
            button.append(' ');
            button.append($('<span/>')
                          .addClass('badge btn btn-xs')
                          .html(keyword.count + '/' + keyword.max));
            div.append(button);
        }
        return div;
    };


    var create_keywords = function(div, cell, celltoolbar) {
        prepare_keywords(cell);
        $(div).append(create_keywords_div(cell));    
    };


    events.on('preset_activated.CellToolbar', function(event, preset) {
        nbcelltesting.create_global_result(preset.name === preset_name);
    });


    function load_extension(){
        nbcelltesting.load_css();

        CellToolbar.register_callback('nblearning.keywords',
                                      create_keywords,
                                      ['code']);
        CellToolbar.register_callback('nblearning.edit_keywords',
                                      create_button_edit_keywords,
                                      ['code']);

        var preset = [
            'nblearning.keywords',
            'nblearning.edit_keywords',
            'nbcelltesting.result_test',
            'nbcelltesting.button_save',
            'nbcelltesting.dropdown_menu',
        ];
        CellToolbar.register_preset(preset_name, preset, Jupyter.notebook);
        console.log('nblearning extension loaded.');
    }


    return {
        load_ipython_extension: load_extension
    };
});
