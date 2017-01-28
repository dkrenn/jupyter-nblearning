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


    var keywords_data = [];


    events.on('change.Cell', function(event, data) {
        cell = data.cell;
        cell.celltoolbar.rebuild();
    });


    var count_occurrences = function(text, str) {
        for (var count=-1, index=0;
             index != -1;
             count++, index=text.indexOf(str, index + 1));
        return count;
    }


    var update_keyword_counts = function(cell) {
        var text = cell.get_text();
        var new_keywords_data = [];
        for (var keyword of keywords_data) {
            var count = count_occurrences(text, keyword.name);
            keyword.count = count;
            new_keywords_data.push(keyword);
        }
        keywords_data = new_keywords_data;
    };


    var prepare_keywords = function(cell) {
        keywords_data = [];

        if (cell.metadata.nblearning !== undefined &&
            cell.metadata.nblearning.keywords !== undefined) {
            keywords_data = cell.metadata.nblearning.keywords;
        }

        update_keyword_counts(cell);
    };


    var create_keywords_div = function(cell) {
        var div = $('<div/>').addClass('keywords');
        for (var keyword of keywords_data) {
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

        var preset = [
            'nblearning.keywords',
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
