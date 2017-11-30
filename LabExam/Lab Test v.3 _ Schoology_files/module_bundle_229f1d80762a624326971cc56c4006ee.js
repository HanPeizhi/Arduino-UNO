Drupal.behaviors.sAttachment = function(context){
  $('.attachments-video-thumbnails-play:not(.sAttachment-processed)', context).addClass('sAttachment-processed').each(function(){
      var btn = $(this);
      btn.bind('click', function(){
        var wrapper = btn.parents(".attachments-video");
        var video = $(".video-video", wrapper);
        wrapper.after(video);
        video.show();
        wrapper.hide();
        thePopup = Popups.activePopup();
        if(thePopup != null){
			Popups.resizeAndCenter(thePopup);
        }
        return false;
      });
  });
  
  $('.embed-cover:not(.sAttachment-processed)', context).addClass('sAttachment-processed').each(function(){
    $(this).click(function(){
      var cover = $(this),
          embedContentObj = cover.siblings('.embed-content:first');
      cover.hide();
      cover.siblings('.embed-title').hide();

      // iframes get wrapped in comments to prevent autoloading
      if(embedContentObj.length){
        var embedNode = embedContentObj.get(0),
            embedContentHTML = null;
        embedContentObj.show();
        $.each(embedNode.childNodes, function(k, node){
          // 8 is COMMENT_NODE (the constants are not properly named as document.COMMENT_NODE in every browser)
          if(node.nodeType == 8){
            embedContentHTML = node.nodeValue;
          }
        });
        if(embedContentHTML){
          embedContentObj.html(embedContentHTML);
        }
      }
    });
  });
  
  $('.attachments-link:not(.sAttachment-processed)', context).addClass('sAttachment-processed').each(function(){
      var link = $(this);
      var intPopup = $('.attachment-link-popup', link);
      link.bind('mouseenter', function(){
	      if(intPopup.length)
	    	  intPopup.show();
      }).bind('mouseleave', function(){
    	  if(intPopup.length)
    	    intPopup.hide();
      });
      //hide the popup if the user goes from the tip arrow in
      intPopup.bind('mouseenter', function(){
    	 $(this).hide(); 
      });
  });
  
}

;Drupal.behaviors.sCommonMediaFileIframeUseRelativeUrl = function(context) {
  
  // Matches paths such as '/media/ifr/1026136881', '/media/ifr/1026132513', etc. in fully-qualified URLs only (SGY-23086)
  var $mediaFileRe = /^\/?media\/ifr\/\d+$/;

  // Matches paths such as '/media/ifr_ext?url=https%3A%2F%2Fiaabccontent.org%2Fdocs%2Fcourses%2Fvideos%2FDefensiveHandling-web.mp4' in fully-qualified URLs only (SGY-25009)
  var $mediaFileExtRe = /^\/?media\/ifr_ext$/;

  $("#main iframe:not(.sCommonMediaFileIframeUseRelativeUrl-processed), .s-page-container iframe:not(.sCommonMediaFileIframeUseRelativeUrl-processed)," +
    ".template-fields iframe:not(.sCommonMediaFileIframeUseRelativeUrl-processed)", context).addClass('sCommonMediaFileIframeUseRelativeUrl-processed').each(function(){

    // If the source of this iframe appears to be a Schoology media file, make the source URL relative.
    var iframeObj = $(this);
    var iframeSrc = iframeObj.attr('src');

    // Create an element to leverage URL parsing (https://gist.github.com/jlong/2428561)
    var parser = document.createElement('a');
    parser.href = iframeSrc;

    var pathName = parser.pathname;
    var $match = $mediaFileRe.exec(pathName);
    if (!$match){
      $match = $mediaFileExtRe.exec(pathName);
    }
    
    if($match){
      // In IE, the leading slash is not included in pathname, so we need to prepend
      // SGY-23250
      if(pathName[0] !== '/'){
        pathName = '/' + pathName;
      }

      // Add search string if present SGY-25009
      if(parser.search){
        pathName += parser.search;
      }
      iframeObj.attr('src', pathName);
    }
  });
};Drupal.behaviors.sCommentsPostCommentForm = function( context ){
  // Comment form wrapper
  $("#s-comments-post-comment-form:not(.sCommentsPostCommentForm-processed), .post-comment-form:not(.sCommentsPostCommentForm-processed)", context).addClass('sCommentsPostCommentForm-processed').each(function(){

    var form = $(this);
    var rtePlaceholder = $('#comment-placeholder', form);
    var rteActualWrapper = $('.form-to-hide', form);
    var submitButton = $('.form-submit', form);
    var submitSpan = submitButton.parent('.submit-span-wrapper:first', form);
    var cancelButton = $('#edit-cancel', form);
    var editComment = $(".form-textarea", form);
    var submitEnabledForm = (form.hasClass('submit-enabled'));
    var focusableElementsString = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]";
    var focusableItems = form.find('*').filter(focusableElementsString);
    var isEdgeFeed = form.closest('.edge-main-wrapper').length > 0;
    var isRichText = editComment.hasClass('s-tinymce-load-editor');

    function toggleSubmit(show){
      submitButton.prop('disabled', !show);
      submitSpan.toggleClass('disabled', !show);
    }

    function processInput(editor){
      editor.onChange.add(function(){
        var hasContent = !!$(editor.getBody().innerHTML).text().length;
        toggleSubmit(hasContent);
      });
      editor.onInit.add(function(){
        // tinymce might take some time to set up...
        setTimeout(function(){
          tinyMCE.execCommand('mceFocus', true, editor.id);
        }, 0);

        if(isEdgeFeed){
          // on the feeds, space is limited so when the user focus out of an empty input
          // the RTE is disabled and reverts back to a good ol' textarea
          tinyMCE.dom.Event.add(editor.getWin(), "blur", function(){
            // bubble up the form focusout defined below when the box has no content
            if(!editor.getContent().length){
              tinyMCE.execCommand('mceRemoveControl', true, editor.id);
              editComment.val(editComment.attr('defaulttext')).trigger('blur');
            }
          });
        }
      });
    }

    if(window.tinyMCE){
      if (tinyMCE.activeEditor != null) {
        processInput(tinyMCE.activeEditor);
      }
      else if(!submitEnabledForm && isRichText) {
        tinyMCE.onAddEditor.add(function (tme, editor) {
          if (editor.id == editComment.attr('id')) {
            processInput(editor);
          }
        });
      }
    }

    form
      .on('focusin', function(e) {
        // for non-threaded comment areas like blog, show/hide profile picture/submit button
        // and resize the comment textarea accordingly
        $("div.author-picture.threadless",form).show();
        $("div.author-picture.threadless",form).siblings('span.submit-span-wrapper').show();
        form.addClass('mouse-focus');

        var textareaObj = form.find('.s-tinymce-load-editor');
        if(textareaObj.length){
          var editorId = textareaObj.attr('id'),
              editor = tinymce.get(editorId);
          if(editor){
            tinyMCE.execCommand('mceAddControl', true, editorId);
          }
          else{
            textareaObj.val('');
            sTinymceInit({
              elements: editorId,
              toolbar: 'basic_comment'
            });
          }
        }
      })
      .on('focusout', function(e) {
        // since nothing is actually in focus on "focusout", using a setTimeout to jump this code to the end of the current execution stack
        // after the execution stack, the next item will be focused and the $(':focus') selector will work
        setTimeout(function() {
          var focusedItem = $(':focus'),
              focusedItemIndex = focusableItems.index(focusedItem);

          // if the currently focused item is outside of the form and the text in textarea is blank or the default text, change it back to the "slim" view
          if(focusedItemIndex === -1 && editComment.val() == editComment.attr('defaulttext')) {
            $("div.author-picture.threadless",form).hide();
            $("div.author-picture.threadless",form).siblings('span.submit-span-wrapper').hide();
            form.removeClass('mouse-focus');

            if( editComment.hasClass('threadless') ) {
              editComment.removeClass('add-comment-resize');
            }
          }
        }, 0);
      });
    
    if(!isRichText){
      editComment
        .on('focus', function() {
          if(editComment.val() == editComment.attr('defaulttext') && editComment.hasClass('pre-fill')) {
            editComment.val('').removeClass('pre-fill');
          }
          if( editComment.hasClass('threadless') ) {
            editComment.addClass('add-comment-resize');
          }
          $(this).trigger("resize");//necessary to get jquery-elastic to know of change in size if textarea changes when we add a avatar icon to next to textarea
        })
        .on('blur', function() {
          if(editComment.val() == '') {
            editComment.val( editComment.attr('defaulttext') ).not('.is-locked').addClass('pre-fill');
          }
        })
        .on('keyup', function(){
          toggleSubmit(editComment.val().length);
        })
        .trigger('blur')
        .elastic();
    }

    function togglePlaceholderForm(){
      if(rtePlaceholder.css('display') == 'none'){
        rtePlaceholder.show();
        rteActualWrapper.hide();
      } else {
        rtePlaceholder.hide();
        rteActualWrapper.show();
        tinyMCE.activeEditor.focus();
        tinyMCE.activeEditor.getBody().focus();
      }
    }
    rtePlaceholder.on('click', togglePlaceholderForm);

    $(cancelButton, form).on('click', function(e){
      e.preventDefault();
      togglePlaceholderForm();
    });

  });
}
;Drupal.behaviors.s_user = function(context){

    $('#s-user-custom-notifications-form:not(.sUser-processed)').addClass('sUser-processed').each(function(){
        //handle select all functionality in custom notification form
        var form = $(this);
        var selectAll = $('.select-all', form);
        selectAll.click(function(){
            var checked = $(this).is(':checked');
            $('.realm-setting', form).each(function(){
                $(this).prop('checked', checked);
            });
        });

        $('.edit-select-all-wrapper', form).click(function(){
            $('input', this).click();
        });


        $('.realm-setting').each(function(){
            var realmSetting = $(this);
            realmSetting.change(function(){
                if(!realmSetting.attr('checked') && selectAll.attr('checked')){
                    selectAll.prop('checked', false);
                }
            });
        });

        $('.cancel-btn', form).click(function(e){
            //reset the value of the correspoding select form in the notifications setting to its original value
            var setting = $('.setting-name', form).val();
            var selectVal = $('.original-setting', form).html();
            $('select[name=' + setting + ']').selectmenu('value', selectVal);
            var popup = Popups.activePopup();
            if(popup != null){
                popup.close();
            }
            e.preventDefault();
        });

    });

    $('.notifications-header:not(.sUser-processed)').addClass('sUser-processed').each(function(){
        // handles reset to default for notification settings
        if(Drupal.settings.s_user != 'undefined' && typeof Drupal.settings.s_user.notif_defaults != 'undefined'){
            var setting = Drupal.settings.s_user;
            $('.reset-default').click(function(){
                $('select.notif-setting-select').each(function(){
                    var name = $(this).attr('name');
                    if(typeof setting.notif_defaults[name] != 'undefined'){
                        $(this).selectmenu('value', setting.notif_defaults[name]);
                    }
                });
            });
        }
    });

    $('#s-user-set-notifications-form:not(.sUser-processed)').addClass('sUser-processed').each(function(){
        //open popup for for when "custom" is selected
        $('select.notif-setting-select').each(function(){
            var select = $(this);
            select.selectmenu({
                style: 'dropdown'
            });
            select.change(function(){
                if(select.val() == '2'){
                    var href = '/user/custom_notification/' + select.attr('name');
                    Popups.openPath(this, {
                        href : href,
                        ajaxForm : false,
                        extraClass : 'popups-custom-notification popups-medium'
                    }, window);
                }
            });
        });
    });

    $('#s-user-invite-colleague-form:not(.sUser-processed)').addClass('sUser-processed').each(function(){
        ZeroClipboard.setMoviePath( '/sites/all/misc/zeroclipboard/zeroclipboard.swf' );
        var clip = new ZeroClipboard.Client();
        clip.setHandCursor( true );
        var text = $('#invite_link #url').html();
        text = text.replace(/&amp;/g, '&');
        clip.setText(text);
        var html = '<span class="zclipboard" style="position:absolute;">' + clip.getHTML( $('#invite_link').outerWidth(), $('#invite_link').outerHeight() ) + '</span>';
        $('.popups-body').append(html);
        repositionZClipboard();

        clip.addEventListener( 'complete', function(client, text) {
            if($('.copied-wrapper').length == 0){
                $('.popups-body').append('<span class="copied-wrapper">Link copied to your clipboard</span>');
            }
            else{
                $('.copied-wrapper').show();
            }
            setTimeout(function(){
                $('.copied-wrapper').fadeOut(400, function(){
                    sPopupsResizeCenter();
                });
            }, 2500);
            sPopupsResizeCenter();
        });

        $('.addresses').focus(function(){
            if($(this).hasClass('pre-fill')){
                $(this).empty();
                $(this).removeClass('pre-fill');
            }
            repositionZClipboard();
        });

        if($('#s-user-invite-colleague-form').hasClass('emails-sent'))
        {
            $('#s-user-invite-colleague-form').removeClass('emails-sent');
            $('.popup-invite').addClass('emails-sent');
            sPopupsResizeCenter();
        }

        $('#s-user-invite-colleagues-invite-by-email').bind('click',
            function(e) {
                $('.popup-invite').addClass('sending-emails');
                $('#s-user-invite-colleagues-invite-choices,#s-user-invite-colleagues-click-to-copy-link,#s-user-invite-colleagues-click-to-copy-title').fadeOut(300,
                    function() {
                        $('#edit-emails,.s-user-invite-colleagues-invite-by-email-buttons').fadeIn(300,
                            function() {
                                repositionZClipboard();
                            }
                            );
                    }
                    );
                e.preventDefault();
            }
            );

        $('#s-user-invite-colleagues-invite-by-email-cancel').unbind('click');
        $('#s-user-invite-colleagues-invite-by-email-cancel').bind('click',
            function(e) {
                $('.popup-invite').removeClass('sending-emails');
                $('#edit-emails,.s-user-invite-colleagues-invite-by-email-buttons').fadeOut(300,
                    function() {
                        $('#s-user-invite-colleagues-invite-choices,#s-user-invite-colleagues-click-to-copy-link,#s-user-invite-colleagues-click-to-copy-title').fadeIn(300,
                            function() {
                                repositionZClipboard();
                            }
                            );
                    }
                    );
                e.preventDefault();
            }
            );

        $("#s-user-invite-colleagues-fb-button,#s-user-invite-colleagues-twitter-button").click(
            function(e) {
              window.open($(this).attr('realhref'), 'popup', 'width=650,height=380', false);
              e.preventDefault();
              return false;
            }
        );
    });

    $("a.show-code").click(function(){
        var value = $(this).attr('id');
        var value = value.split("-");
        var html = '<div class="formatted-code">Code: '+value[1]+'</div>';
        $.prompt(html);
        return false;
    });

    $("input#action-select-all").click(function(){
        var parent = $(this);
        $("#s-user-manage-activation-form table input:checkbox").each(function(){
            if($(this).attr('checked')){
                $(parent).prop('checked', false);
                $(this).prop('checked', false);
            }
            else{
                $(parent).prop('checked', true);
                $(this).prop('checked', true);
            }
        });
    });

    $('#s-user-edit-calendar-feed-settings-form:not(.sUser-processed)').addClass('sUser-processed').each(function(){
        $('#webcal-addr', $(this)).focus(function(){
            document.getElementById('webcal-addr').select();
        }).mouseup(function(e){
            e.preventDefault();
        });

    });

    $('#s-user-profile-editor-profile-form:not(.sUser-processed)').addClass('sUser-processed').each(function(){
        $('textarea', $(this)).elastic();

        var learnerWrapper = $('.learner-style-wrappper');
        var defaultLearnerRadioBtnWrapper = $('#edit-profile-about-learner-style-0-wrapper', learnerWrapper);
        var defaultLeanerRadioBtn = $('input[type=radio]', defaultLearnerRadioBtnWrapper);
        defaultLearnerRadioBtnWrapper.hide();
        sCommonFormRadioGroup(learnerWrapper, defaultLeanerRadioBtn);
    });

    $('#s-user-personal-account-settings-form:not(.sUser-processed)').addClass('sUser-processed').each(function(){
      var form  = $(this);
      $('.timezone-select-time .timezone-use-list', form).bind('click', function(){
        $(this).parent().hide();
        $('.timezone-select-timezone', form).show();
        $('#edit-timezone-select-type', form).val('timezone');
      });
      $('.timezone-select-timezone .timezone-use-time', form).bind('click', function(){
        $(this).parent().hide();
        $('.timezone-select-time', form).show();
        $('#edit-timezone-select-type', form).val('time');
      });

      //only display the show preferred name dropdown if a preferred name has been set
      $('#edit-user-name-first-preferred').on('keydown paste input', function(e){
        var $textbox = $(this);
        var hasPreferredName = !!$textbox.val().length;
        var $namePreferredWrapper = $textbox.closest('.name-first-preferred-wrapper');
        var $usePreferredName = $('.use-name-first-preferred-wrapper');
        var usePreferredNameVisible = !$usePreferredName.hasClass('hidden');
        if(hasPreferredName != usePreferredNameVisible){
          $usePreferredName.toggleClass('hidden', usePreferredNameVisible);
          $namePreferredWrapper.toggleClass('has-preferred-first-name', hasPreferredName);
        }
      });
    });

    $('.s-js-name-title-wrapper:not(.sUser-processed)', context).addClass('sUser-processed').each(function(){
      var titleWrapper = $(this),
          customField = $('.s-js-name-title-custom', titleWrapper);
      $('.s-js-name-title-select', titleWrapper).change(function(e){
        if($(this).val() == 'custom'){
          titleWrapper.addClass('s-js-name-title-custom-enabled');
        }
        else{
          titleWrapper.removeClass('s-js-name-title-custom-enabled');
          customField.val('');
        }
      }).triggerHandler('change');
    });

    //performs logout when an account is deleted
    if($('.logout-exec').text() == '1'){
        var url = location.href;
        index = url.indexOf('settings/');

        var logoutHref = '/logout?';
        if (Drupal.settings.s_common.hasOwnProperty('logout_token')){
            logoutHref += 'ltoken='+Drupal.settings.s_common.logout_token+'&';
        }
        logoutHref += 'destination=home.php?deleted';
        newUrl = url.substring(0,index) + logoutHref;
        location.href = newUrl;
    };



   $('.profile-picture-wrapper:not(.sUser-processed)', context).addClass('sUser-processed').each(function(){
        var wrapper = $(this);
        var link = $('.edit-profile-picture-hover', wrapper);
        var pic = $('.profile-picture', wrapper);
        var uploader = $('#profile-picture-uploader-wrapper', wrapper);

        link.bind('click', function(){
          if(uploader.is(':visible')){
            uploader.hide();
          }
          else {
            uploader.show();
          }
        });
        $('body').bind('click', function(e){
            var target = $(e.target);
            if(!target.hasClass('profile-picture-wrapper') && target.parents('.profile-picture-wrapper').length == 0){
              uploader.hide();
            }
          });

        pic.bind('s_profile_picture_uploaded', function(e, path){
	      	$('img', $(this)).attr('src', path).removeAttr('height');
	        uploader.hide();
	      });

      });

  // remove a push notification device on the notifications settings page
  $('.push-remove:not(.sUser-processed)', context).addClass('sUser-processed').bind('click', function(e){
    e.preventDefault();

    var linkObj = $(this);
    var deviceNameString = '<span class="confirm-remove-device-name">' + linkObj.siblings('.push-os').html() + '</span>';
    var removeDevicePopupBody = '<span class="confirm-message">' +
      Drupal.t('Are you sure you want to deactivate !device_name?', {"!device_name" : deviceNameString}) +
      '</span>';

    sCommonConfirmationPopup({
      title: Drupal.t('Deactivate Device'),
      body: removeDevicePopupBody,
      extraClass: 'push-remove',
      confirm: {
        text: Drupal.t('Deactivate'),
        func: function(){
          $.ajax(linkObj.attr('href'), {
            data: {ajax: true},
            success: function(data){
              if(data.body){
                $('#content-wrapper').html(data.body);
                if(data.messages){
                  var mainWrapperObj = $('#main-content-wrapper');
                  mainWrapperObj.children('.messages').remove();
                  mainWrapperObj.prepend(data.messages);
                }
                Drupal.attachBehaviors($('#main-content-wrapper'));
              }
            },
            complete: function(){
              Popups.activePopup().close();
            }
          });
        }
      }
    });
  });
}

function repositionZClipboard(){
    var offset = $('#invite_link').offset();
    var pOffset = $('.popups-box').offset();
    $('.zclipboard').css('left', offset.left - pOffset.left);
    $('.zclipboard').css('top', offset.top - pOffset.top);
}
;Drupal.behaviors.sDropItem = function(context){
  sDropUploads = [];
  sDropsel_ids = new Array();

  // ajax behavior for dropbox filter select
  $('.drop-items:not(.sDropItem-processed)', context).addClass('sDropItem-processed').each(function(){
    var wrapper = $(this);
    var dropbox = $('.drop-item-display-all', wrapper);

    $('.dropbox-download-all', dropbox).tipsy({
     gravity: 's'
    });
  });

  $('.item-list:not(.sDropItem-processed)', context).addClass('sDropItem-processed').each(function() {
    var reactElements = $('.portfolio-add-submission-btn-wrapper', this).toArray();
    if (reactElements.length) {
      window.sgyModules.bootstrapReactApp({appInstanceIndex: 'sgyPortfolioComponents'})
        .then(function() {
          $.each(window.addtoPFLBtnRenders, function(){this()});
          window.addtoPFLBtnRenders = null;
        });
    }

    $(this).on('click', 'a.dropbox-view-link', function() {
      Popups.removeLoading();
      window.scrollBy(0,-100000);
      Popups.addLoading();
    });
  });

  $('#dropbox-submitted-filter:not(.sDropItem-processed)', context).addClass('sDropItem-processed').each(function(){
    var filter = $(this);
    var wrapper = filter.closest('.drop-items');
    var dropbox = $('.drop-item-display-all', wrapper);
    var csmToggle = $('.csm-toggle-sections', wrapper);

    $(this).selectmenu({
      style: 'dropdown',
      align: 'right'
    }).change(function(){
      $('.right-block-big', dropbox).html('<img src="/sites/all/themes/schoology_theme/images/ajax-loader.gif" alt="' + Drupal.t('Loading...') + '" />');

      var ajaxUrl = '/assignment/'+(location.pathname.split('/')[2])+'/dropbox/users_ajax?submission_status=' + $(this).val();
      if(csmToggle.length){
        ajaxUrl += '&csm_section_nid=' + csmToggle.select2('data').id;
      }

      $.ajax({
        type: "GET",
        url: ajaxUrl,
        dataType: "json",
        success: function(json){
          var output = $(json);
          Drupal.attachBehaviors(output);
          $('.right-block-big', dropbox).empty().append(output);
        }
      });
    });
  });


  $('.drop-item-display-all ul:not(.sDropItem-processed), .dropbox-filter-ajax-response ul:not(.sDropItem-processed)', context).addClass('sDropItem-processed').each(function(){
    var wrapper = $(this);
    $('li', wrapper).tipsy({
      html: false,
      gravity: 'e'
    });
  });

  $('.drop-item-display-own ul:not(.sDropItem-processed)', context).addClass('sDropItem-processed').each(function(){
    var wrapper = $(this);
    $('li', wrapper).tipsy({
      html: false,
      gravity: 'e'
    });
  });

  // Submit Assignment behavior
  $('#s-drop-item-submit-wrapper:not(.sDropItem-processed)', context).addClass('sDropItem-processed').each(function(){
    var wrapper = $(this);

    $('.popups-tabs li', wrapper).each(function(){
      $(this).bind('click',function(){
        var selectedTab = $(this);
        var id = selectedTab.attr('id');

        if( id =='dropbox-submit-create-tab' )
          $('#edit-submission_tbl').css('width','100%');

        $('.popups-tabs li.active', wrapper).not(selectedTab).removeClass('active');
        selectedTab.addClass('active');

        var selectedContent = $('#' + id + '-content' , wrapper );

        $('.popups-tab-content', wrapper).not(selectedContent).removeClass('visible');
        selectedContent.addClass('visible');

        if( id =='dropbox-submit-create-tab' ) {
          var activeEditorId = tinyMCE.activeEditor.id;
          tinyMCE.execCommand('mceRemoveControl', true, activeEditorId);
          tinyMCE.execCommand('mceAddControl', true, activeEditorId);
        }

        popup = Popups.activePopup();
        var popupId = popup.id;
        $('#' + popupId + ' .popups-title .title').html(selectedTab.html());

        if(popup != null){
          var popupObj = popup.$popup();
          var classes = {
            'popups-compose': 'dropbox-submit-create-tab',
            'popups-library': 'dropbox-submit-resources-tab'
          };
          // only set the popupObj to have the class associated with the current tab, remove all other classes
          $.each(classes, function(className, tabId){
            if(id == tabId){
              popupObj.addClass(className);
            }
            else{
              popupObj.removeClass(className);
            }
          });
          Popups.resizeAndCenter(popup);
        }
      })
    });

    // remove embedding features from tinyMCE
    $('.tinymce-ext-buttons'  , wrapper).empty();

    // this is to allow the tinymce editor to steal focus for a quick moment;
    // otherwise, other textareas cannot be edited in IE
    setTimeout("$('#s-drop-item-submit-wrapper .popups-tabs li:eq(0)').click()", 1);

    //Fairly hacky way of ensuring we only rebind the Popups error handler once
    $('body:not(.sDropItem-processed)').addClass('sDropItem-processed').each(function(){
      var popupErrorFunc = Popups.errorMessage;
      Popups.errorPassthru = function ($form) {
        var formId = $form.attr('id');
        if (formId === "s-drop-item-submit-create-form") {
          Popups.message(
            Drupal.t('Submission Error'),
            '<p>' + Drupal.t('There was an error submitting your assignment. A draft of your assignment was saved in the Submissions panel.') + '</p>' +
            '<p>' + Drupal.t('Please try submitting again in a few minutes.') + '</p>'
          );
        }
        else {
          newArgs = Array.from(arguments);
          popupErrorFunc(...newArgs.slice(1));
        }
      }
    });

    //Hijack the popups "before submit" event to bind the form being submitted to the error handler closure
    //This allows us to display a custom error message for submissions created within the RTE
    $(document).one('popups_before_submit', function(event, formData, $form, options) {
      Popups.errorMessage = Popups.errorPassthru.bind(this, $form);
    });
  });
}
;/**
 * Copyleft 2010-2011 Jay and Han (laughinghan@gmail.com)
 *   under the GNU Lesser General Public License
 *     http://www.gnu.org/licenses/lgpl.html
 * Project Website: http://mathquill.com
 *
 * @note v0.9.1
 *
 * 2013-3-22 removed single letter commands such as LatexCmds.C since they cause problems when parsing something like
 * \sqrt{C}. The parser will turn the C into a \complex which is not desirable
 * Commands affected: NPZQRCHoO
 * @see https://github.com/mathquill/mathquill/issues/164
 *
 */

(function() {

var $ = jQuery,
  undefined,
  _, //temp variable of prototypes
  mqCmdId = 'mathquill-command-id',
  mqBlockId = 'mathquill-block-id',
  min = Math.min,
  max = Math.max;

var __slice = [].slice;

function noop() {}

/**
 * sugar to make defining lots of commands easier.
 * TODO: rethink this.
 */
function bind(cons /*, args... */) {
  var args = __slice.call(arguments, 1);
  return function() {
    return cons.apply(this, args);
  };
}

/**
 * a development-only debug method.  This definition and all
 * calls to `pray` will be stripped from the minified
 * build of mathquill.
 *
 * This function must be called by name to be removed
 * at compile time.  Do not define another function
 * with the same name, and only call this function by
 * name.
 */
function pray(message, cond) {
  if (!cond) throw new Error('prayer failed: '+message);
}
var P = (function(prototype, ownProperty, undefined) {
  // helper functions that also help minification
  function isObject(o) { return typeof o === 'object'; }
  function isFunction(f) { return typeof f === 'function'; }

  function P(_superclass /* = Object */, definition) {
    // handle the case where no superclass is given
    if (definition === undefined) {
      definition = _superclass;
      _superclass = Object;
    }

    // C is the class to be returned.
    // There are three ways C will be called:
    //
    // 1) We call `new C` to create a new uninitialized object.
    //    The behavior is similar to Object.create, where the prototype
    //    relationship is set up, but the ::init method is not run.
    //    Note that in this case we have `this instanceof C`, so we don't
    //    spring the first trap. Also, `args` is undefined, so the initializer
    //    doesn't get run.
    //
    // 2) A user will simply call C(a, b, c, ...) to create a new object with
    //    initialization.  This allows the user to create objects without `new`,
    //    and in particular to initialize objects with variable arguments, which
    //    is impossible with the `new` keyword.  Note that in this case,
    //    !(this instanceof C) springs the return trap at the beginning, and
    //    C is called with the `new` keyword and one argument, which is the
    //    Arguments object passed in.
    //
    // 3) For internal use only, if new C(args) is called, where args is an
    //    Arguments object.  In this case, the presence of `new` means the
    //    return trap is not sprung, but the initializer is called if present.
    //
    //    You can also call `new C([a, b, c])`, which is equivalent to `C(a, b, c)`.
    //
    //  TODO: the Chrome inspector shows all created objects as `C` rather than `Object`.
    //        Setting the .name property seems to have no effect.  Is there a way to override
    //        this behavior?
    function C(args) {
      var self = this;
      if (!(self instanceof C)) return new C(arguments);
      if (args && isFunction(self.init)) self.init.apply(self, args);
    }

    // set up the prototype of the new class
    // note that this resolves to `new Object`
    // if the superclass isn't given
    var proto = C[prototype] = new _superclass();
    var _super = _superclass[prototype];
    var extensions;

    var mixin = C.mixin = function(def) {
      extensions = {};

      if (isFunction(def)) {
        // call the defining function with all the arguments you need
        // extensions captures the return value.
        extensions = def.call(C, proto, _super, C, _superclass);
      }
      else if (isObject(def)) {
        // if you passed an object instead, we'll take it
        extensions = def;
      }

      // ...and extend it
      if (isObject(extensions)) {
        for (var ext in extensions) {
          if (ownProperty.call(extensions, ext)) {
            proto[ext] = extensions[ext];
          }
        }
      }

      // if there's no init, we assume we're inheriting a non-pjs class, so
      // we default to applying the superclass's constructor.
      if (!isFunction(proto.init)) {
        proto.init = function() { _superclass.apply(this, arguments); };
      }

      return C;
    };

    // set the constructor property, for convenience
    proto.constructor = C;

    return mixin(definition);
  }

  // ship it
  return P;

  // as a minifier optimization, we've closured in a few helper functions
  // and the string 'prototype' (C[p] is much shorter than C.prototype)
})('prototype', ({}).hasOwnProperty);
/*************************************************
 * Textarea Manager
 *
 * An abstraction layer wrapping the textarea in
 * an object with methods to manipulate and listen
 * to events on, that hides all the nasty cross-
 * browser incompatibilities behind a uniform API.
 *
 * Design goal: This is a *HARD* internal
 * abstraction barrier. Cross-browser
 * inconsistencies are not allowed to leak through
 * and be dealt with by event handlers. All future
 * cross-browser issues that arise must be dealt
 * with here, and if necessary, the API updated.
 *
 * Organization:
 * - key values map and stringify()
 * - manageTextarea()
 *    + defer() and flush()
 *    + event handler logic
 *    + attach event handlers and export methods
 ************************************************/

var manageTextarea = (function() {
  // The following [key values][1] map was compiled from the
  // [DOM3 Events appendix section on key codes][2] and
  // [a widely cited report on cross-browser tests of key codes][3],
  // except for 10: 'Enter', which I've empirically observed in Safari on iOS
  // and doesn't appear to conflict with any other known key codes.
  //
  // [1]: http://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#keys-keyvalues
  // [2]: http://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#fixed-virtual-key-codes
  // [3]: http://unixpapa.com/js/key.html
  var KEY_VALUES = {
    8: 'Backspace',
    9: 'Tab',

    10: 'Enter', // for Safari on iOS

    13: 'Enter',

    16: 'Shift',
    17: 'Control',
    18: 'Alt',
    20: 'CapsLock',

    27: 'Esc',

    32: 'Spacebar',

    33: 'PageUp',
    34: 'PageDown',
    35: 'End',
    36: 'Home',

    37: 'Left',
    38: 'Up',
    39: 'Right',
    40: 'Down',

    45: 'Insert',

    46: 'Del',

    144: 'NumLock'
  };

  // To the extent possible, create a normalized string representation
  // of the key combo (i.e., key code and modifier keys).
  function stringify(evt) {
    var which = evt.which || evt.keyCode;
    var keyVal = KEY_VALUES[which];
    var key;
    var modifiers = [];

    if (evt.ctrlKey) modifiers.push('Ctrl');
    if (evt.originalEvent && evt.originalEvent.metaKey) modifiers.push('Meta');
    if (evt.altKey) modifiers.push('Alt');
    if (evt.shiftKey) modifiers.push('Shift');

    key = keyVal || String.fromCharCode(which);

    if (!modifiers.length && !keyVal) return key;

    modifiers.push(key);
    return modifiers.join('-');
  }

  // create a textarea manager that calls callbacks at useful times
  // and exports useful public methods
  return function manageTextarea(el, opts) {
    var keydown = null;
    var keypress = null;

    if (!opts) opts = {};
    var textCallback = opts.text || noop;
    var keyCallback = opts.key || noop;
    var pasteCallback = opts.paste || noop;
    var onCut = opts.cut || noop;

    var textarea = $(el);
    var target = $(opts.container || textarea);

    // defer() runs fn immediately after the current thread.
    // flush() will run it even sooner, if possible.
    // flush always needs to be called before defer, and is called a
    // few other places besides.
    var timeout, deferredFn;

    function defer(fn) {
      timeout = setTimeout(fn);
      deferredFn = fn;
    }

    function flush() {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
        deferredFn();
      }
    }

    target.bind('keydown keypress input keyup focusout paste', flush);


    // -*- public methods -*- //
    function select(text) {
      flush();

      textarea.val(text);
      if (text) textarea[0].select();
    }

    // -*- helper subroutines -*- //

    // Determine whether there's a selection in the textarea.
    // This will always return false in IE < 9, which don't support
    // HTMLTextareaElement::selection{Start,End}.
    function hasSelection() {
      var dom = textarea[0];

      if (!('selectionStart' in dom)) return false;
      return dom.selectionStart !== dom.selectionEnd;
    }

    function popText(callback) {
      var text = textarea.val();
      textarea.val('');
      if (text) callback(text);
    }

    function handleKey() {
      keyCallback(stringify(keydown), keydown);
    }

    // -*- event handlers -*- //
    function onKeydown(e) {
      keydown = e;
      keypress = null;

      handleKey();
    }

    function onKeypress(e) {
      // call the key handler for repeated keypresses.
      // This excludes keypresses that happen directly
      // after keydown.  In that case, there will be
      // no previous keypress, so we skip it here
      if (keydown && keypress) handleKey();

      keypress = e;

      defer(function() {
        // If there is a selection, the contents of the textarea couldn't
        // possibly have just been typed in.
        // This happens in browsers like Firefox and Opera that fire
        // keypress for keystrokes that are not text entry and leave the
        // selection in the textarea alone, such as Ctrl-C.
        // Note: we assume that browsers that don't support hasSelection()
        // also never fire keypress on keystrokes that are not text entry.
        // This seems reasonably safe because:
        // - all modern browsers including IE 9+ support hasSelection(),
        //   making it extremely unlikely any browser besides IE < 9 won't
        // - as far as we know IE < 9 never fires keypress on keystrokes
        //   that aren't text entry, which is only as reliable as our
        //   tests are comprehensive, but the IE < 9 way to do
        //   hasSelection() is poorly documented and is also only as
        //   reliable as our tests are comprehensive
        // If anything like #40 or #71 is reported in IE < 9, see
        // b1318e5349160b665003e36d4eedd64101ceacd8
        if (hasSelection()) return;

        popText(textCallback);
      });
    }

    function onBlur() { keydown = keypress = null; }

    function onPaste(e) {
      // browsers are dumb.
      //
      // In Linux, middle-click pasting causes onPaste to be called,
      // when the textarea is not necessarily focused.  We focus it
      // here to ensure that the pasted text actually ends up in the
      // textarea.
      //
      // It's pretty nifty that by changing focus in this handler,
      // we can change the target of the default action.  (This works
      // on keydown too, FWIW).
      //
      // And by nifty, we mean dumb (but useful sometimes).
      textarea.focus();

      defer(function() {
        popText(pasteCallback);
      });
    }

    // -*- attach event handlers -*- //
    target.bind({
      keydown: onKeydown,
      keypress: onKeypress,
      focusout: onBlur,
      cut: onCut,
      paste: onPaste
    });

    // -*- export public methods -*- //
    return {
      select: select
    };
  };
}());
var Parser = P(function(_, _super, Parser) {
  // The Parser object is a wrapper for a parser function.
  // Externally, you use one to parse a string by calling
  //   var result = SomeParser.parse('Me Me Me! Parse Me!');
  // You should never call the constructor, rather you should
  // construct your Parser from the base parsers and the
  // parser combinator methods.

  function parseError(stream, message) {
    if (stream) {
      stream = "'"+stream+"'";
    }
    else {
      stream = 'EOF';
    }

    throw 'Parse Error: '+message+' at '+stream;
  }

  _.init = function(body) { this._ = body; };

  _.parse = function(stream) {
    return this.skip(eof)._(stream, success, parseError);

    function success(stream, result) { return result; }
  };

  // -*- primitive combinators -*- //
  _.or = function(alternative) {
    pray('or is passed a parser', alternative instanceof Parser);

    var self = this;

    return Parser(function(stream, onSuccess, onFailure) {
      return self._(stream, onSuccess, failure);

      function failure(newStream) {
        return alternative._(stream, onSuccess, onFailure);
      }
    });
  };

  _.then = function(next) {
    var self = this;

    return Parser(function(stream, onSuccess, onFailure) {
      return self._(stream, success, onFailure);

      function success(newStream, result) {
        var nextParser = (next instanceof Parser ? next : next(result));
        pray('a parser is returned', nextParser instanceof Parser);
        return nextParser._(newStream, onSuccess, onFailure);
      }
    });
  };

  // -*- optimized iterative combinators -*- //
  _.many = function() {
    var self = this;

    return Parser(function(stream, onSuccess, onFailure) {
      var xs = [];
      while (self._(stream, success, failure));
      return onSuccess(stream, xs);

      function success(newStream, x) {
        stream = newStream;
        xs.push(x);
        return true;
      }

      function failure() {
        return false;
      }
    });
  };

  _.times = function(min, max) {
    if (arguments.length < 2) max = min;
    var self = this;

    return Parser(function(stream, onSuccess, onFailure) {
      var xs = [];
      var result = true;
      var failure;

      for (var i = 0; i < min; i += 1) {
        result = self._(stream, success, firstFailure);
        if (!result) return onFailure(stream, failure);
      }

      for (; i < max && result; i += 1) {
        result = self._(stream, success, secondFailure);
      }

      return onSuccess(stream, xs);

      function success(newStream, x) {
        xs.push(x);
        stream = newStream;
        return true;
      }

      function firstFailure(newStream, msg) {
        failure = msg;
        stream = newStream;
        return false;
      }

      function secondFailure(newStream, msg) {
        return false;
      }
    });
  };

  // -*- higher-level combinators -*- //
  _.result = function(res) { return this.then(succeed(res)); };
  _.atMost = function(n) { return this.times(0, n); };
  _.atLeast = function(n) {
    var self = this;
    return self.times(n).then(function(start) {
      return self.many().map(function(end) {
        return start.concat(end);
      });
    });
  };

  _.map = function(fn) {
    return this.then(function(result) { return succeed(fn(result)); });
  };

  _.skip = function(two) {
    return this.then(function(result) { return two.result(result); });
  };

  // -*- primitive parsers -*- //
  var string = this.string = function(str) {
    var len = str.length;
    var expected = "expected '"+str+"'";

    return Parser(function(stream, onSuccess, onFailure) {
      var head = stream.slice(0, len);

      if (head === str) {
        return onSuccess(stream.slice(len), head);
      }
      else {
        return onFailure(stream, expected);
      }
    });
  };

  var regex = this.regex = function(re) {
    pray('regexp parser is anchored', re.toString().charAt(1) === '^');

    var expected = 'expected '+re;

    return Parser(function(stream, onSuccess, onFailure) {
      var match = re.exec(stream);

      if (match) {
        var result = match[0];
        return onSuccess(stream.slice(result.length), result);
      }
      else {
        return onFailure(stream, expected);
      }
    });
  };

  var succeed = Parser.succeed = function(result) {
    return Parser(function(stream, onSuccess) {
      return onSuccess(stream, result);
    });
  };

  var fail = Parser.fail = function(msg) {
    return Parser(function(stream, _, onFailure) {
      return onFailure(stream, msg);
    });
  };

  var letter = Parser.letter = regex(/^[a-z]/i);
  var letters = Parser.letters = regex(/^[a-z]*/i);
  var digit = Parser.digit = regex(/^[0-9]/);
  var digits = Parser.digits = regex(/^[0-9]*/);
  var whitespace = Parser.whitespace = regex(/^\s+/);
  var optWhitespace = Parser.optWhitespace = regex(/^\s*/);

  var any = Parser.any = Parser(function(stream, onSuccess, onFailure) {
    if (!stream) return onFailure(stream, 'expected any character');

    return onSuccess(stream.slice(1), stream.charAt(0));
  });

  var all = Parser.all = Parser(function(stream, onSuccess, onFailure) {
    return onSuccess('', stream);
  });

  var eof = Parser.eof = Parser(function(stream, onSuccess, onFailure) {
    if (stream) return onFailure(stream, 'expected EOF');

    return onSuccess(stream, stream);
  });
});
/*************************************************
 * Base classes of the MathQuill virtual DOM tree
 *
 * Only doing tree node manipulation via these
 * adopt/ disown methods guarantees well-formedness
 * of the tree.
 ************************************************/

/**
 * MathQuill virtual-DOM tree-node abstract base class
 */
var Node = P(function(_) {
  _.prev = 0;
  _.next = 0;
  _.parent = 0;
  _.firstChild = 0;
  _.lastChild = 0;

  _.children = function() {
    return Fragment(this.firstChild, this.lastChild);
  };

  _.eachChild = function(fn) {
    return this.children().each(fn);
  };

  _.foldChildren = function(fold, fn) {
    return this.children().fold(fold, fn);
  };

  _.adopt = function(parent, prev, next) {
    Fragment(this, this).adopt(parent, prev, next);
    return this;
  };

  _.disown = function() {
    Fragment(this, this).disown();
    return this;
  };
});

/**
 * An entity outside the virtual tree with one-way pointers (so it's only a
 * "view" of part of the tree, not an actual node/entity in the tree) that
 * delimits a doubly-linked list of sibling nodes.
 * It's like a fanfic love-child between HTML DOM DocumentFragment and the Range
 * classes: like DocumentFragment, its contents must be sibling nodes
 * (unlike Range, whose contents are arbitrary contiguous pieces of subtrees),
 * but like Range, it has only one-way pointers to its contents, its contents
 * have no reference to it and in fact may still be in the visible tree (unlike
 * DocumentFragment, whose contents must be detached from the visible tree
 * and have their 'parent' pointers set to the DocumentFragment).
 */
var Fragment = P(function(_) {
  _.first = 0;
  _.last = 0;

  _.init = function(first, last) {
    pray('no half-empty fragments', !first === !last);

    if (!first) return;

    pray('first node is passed to Fragment', first instanceof Node);
    pray('last node is passed to Fragment', last instanceof Node);
    pray('first and last have the same parent',
         first.parent === last.parent);

    this.first = first;
    this.last = last;
  };

  function prayWellFormed(parent, prev, next) {
    pray('a parent is always present', parent);
    pray('prev is properly set up', (function() {
      // either it's empty and next is the first child (possibly empty)
      if (!prev) return parent.firstChild === next;

      // or it's there and its next and parent are properly set up
      return prev.next === next && prev.parent === parent;
    })());

    pray('next is properly set up', (function() {
      // either it's empty and prev is the last child (possibly empty)
      if (!next) return parent.lastChild === prev;

      // or it's there and its next and parent are properly set up
      return next.prev === prev && next.parent === parent;
    })());
  }

  _.adopt = function(parent, prev, next) {
    prayWellFormed(parent, prev, next);

    var self = this;
    self.disowned = false;

    var first = self.first;
    if (!first) return this;

    var last = self.last;

    if (prev) {
      // NB: this is handled in the ::each() block
      // prev.next = first
    } else {
      parent.firstChild = first;
    }

    if (next) {
      next.prev = last;
    } else {
      parent.lastChild = last;
    }

    self.last.next = next;

    self.each(function(el) {
      el.prev = prev;
      el.parent = parent;
      if (prev) prev.next = el;

      prev = el;
    });

    return self;
  };

  _.disown = function() {
    var self = this;
    var first = self.first;

    // guard for empty and already-disowned fragments
    if (!first || self.disowned) return self;

    self.disowned = true;

    var last = self.last;
    var parent = first.parent;

    prayWellFormed(parent, first.prev, first);
    prayWellFormed(parent, last, last.next);

    if (first.prev) {
      first.prev.next = last.next;
    } else {
      parent.firstChild = last.next;
    }

    if (last.next) {
      last.next.prev = first.prev;
    } else {
      parent.lastChild = first.prev;
    }

    return self;
  };

  _.each = function(fn) {
    var self = this;
    var el = self.first;
    if (!el) return self;

    for (;el !== self.last.next; el = el.next) {
      if (fn.call(self, el) === false) break;
    }

    return self;
  };

  _.fold = function(fold, fn) {
    this.each(function(el) {
      fold = fn.call(this, fold, el);
    });

    return fold;
  };
});
/*************************************************
 * Abstract classes of math blocks and commands.
 ************************************************/

var uuid = (function() {
  var id = 0;

  return function() { return id += 1; };
})();

/**
 * Math tree node base class.
 * Some math-tree-specific extensions to Node.
 * Both MathBlock's and MathCommand's descend from it.
 */
var MathElement = P(Node, function(_) {
  _.init = function(obj) {
    this.id = uuid();
    MathElement[this.id] = this;
  };

  _.toString = function() {
    return '[MathElement '+this.id+']';
  };

  _.bubble = function(event /*, args... */) {
    var args = __slice.call(arguments, 1);

    for (var ancestor = this; ancestor; ancestor = ancestor.parent) {
      var res = ancestor[event] && ancestor[event].apply(ancestor, args);
      if (res === false) break;
    }

    return this;
  };

  _.postOrder = function(fn /*, args... */) {
    var args = __slice.call(arguments, 1);

    if (typeof fn === 'string') {
      var methodName = fn;
      fn = function(el) {
        if (methodName in el) el[methodName].apply(el, arguments);
      };
    }

    (function recurse(desc) {
      desc.eachChild(recurse);
      fn(desc);
    })(this);
  };

  _.jQ = $();
  _.jQadd = function(jQ) { this.jQ = this.jQ.add(jQ); };

  this.jQize = function(html) {
    // Sets the .jQ of the entire math subtree rooted at this command.
    // Expects .createBlocks() to have been called already, since it
    // calls .html().
    var jQ = $(html);
    jQ.find('*').andSelf().each(function() {
      var jQ = $(this),
        cmdId = jQ.attr('mathquill-command-id'),
        blockId = jQ.attr('mathquill-block-id');
      if (cmdId) MathElement[cmdId].jQadd(jQ);
      if (blockId) MathElement[blockId].jQadd(jQ);
    });
    return jQ;
  };

  _.finalizeInsert = function() {
    var self = this;
    self.postOrder('finalizeTree');

    // note: this order is important.
    // empty elements need the empty box provided by blur to
    // be present in order for their dimensions to be measured
    // correctly in redraw.
    self.postOrder('blur');

    // adjust context-sensitive spacing
    self.postOrder('respace');
    if (self.next.respace) self.next.respace();
    if (self.prev.respace) self.prev.respace();

    self.postOrder('redraw');
    self.bubble('redraw');
  };
});

/**
 * Commands and operators, like subscripts, exponents, or fractions.
 * Descendant commands are organized into blocks.
 */
var MathCommand = P(MathElement, function(_, _super) {
  _.init = function(ctrlSeq, htmlTemplate, textTemplate) {
    var cmd = this;
    _super.init.call(cmd);

    if (!cmd.ctrlSeq) cmd.ctrlSeq = ctrlSeq;
    if (htmlTemplate) cmd.htmlTemplate = htmlTemplate;
    if (textTemplate) cmd.textTemplate = textTemplate;
  };

  // obvious methods
  _.replaces = function(replacedFragment) {
    replacedFragment.disown();
    this.replacedFragment = replacedFragment;
  };
  _.isEmpty = function() {
    return this.foldChildren(true, function(isEmpty, child) {
      return isEmpty && child.isEmpty();
    });
  };

  _.parser = function() {
    var block = latexMathParser.block;
    var self = this;

    return block.times(self.numBlocks()).map(function(blocks) {
      self.blocks = blocks;

      for (var i = 0; i < blocks.length; i += 1) {
        blocks[i].adopt(self, self.lastChild, 0);
      }

      return self;
    });
  };

  // createBefore(cursor) and the methods it calls
  _.createBefore = function(cursor) {
    var cmd = this;
    var replacedFragment = cmd.replacedFragment;

    cmd.createBlocks();
    MathElement.jQize(cmd.html());
    if (replacedFragment) {
      replacedFragment.adopt(cmd.firstChild, 0, 0);
      replacedFragment.jQ.appendTo(cmd.firstChild.jQ);
    }

    cursor.jQ.before(cmd.jQ);
    cursor.prev = cmd.adopt(cursor.parent, cursor.prev, cursor.next);

    cmd.finalizeInsert(cursor);

    cmd.placeCursor(cursor);
  };
  _.createBlocks = function() {
    var cmd = this,
      numBlocks = cmd.numBlocks(),
      blocks = cmd.blocks = Array(numBlocks);

    for (var i = 0; i < numBlocks; i += 1) {
      var newBlock = blocks[i] = MathBlock();
      newBlock.adopt(cmd, cmd.lastChild, 0);
    }
  };
  _.respace = noop; //placeholder for context-sensitive spacing
  _.placeCursor = function(cursor) {
    //append the cursor to the first empty child, or if none empty, the last one
    cursor.appendTo(this.foldChildren(this.firstChild, function(prev, child) {
      return prev.isEmpty() ? prev : child;
    }));
  };

  // remove()
  _.remove = function() {
    this.disown()
    this.jQ.remove();

    this.postOrder(function(el) { delete MathElement[el.id]; });

    return this;
  };

  // methods involved in creating and cross-linking with HTML DOM nodes
  /*
    They all expect an .htmlTemplate like
      '<span>&0</span>'
    or
      '<span><span>&0</span><span>&1</span></span>'

    See html.test.js for more examples.

    Requirements:
    - For each block of the command, there must be exactly one "block content
      marker" of the form '&<number>' where <number> is the 0-based index of the
      block. (Like the LaTeX \newcommand syntax, but with a 0-based rather than
      1-based index, because JavaScript because C because Dijkstra.)
    - The block content marker must be the sole contents of the containing
      element, there can't even be surrounding whitespace, or else we can't
      guarantee sticking to within the bounds of the block content marker when
      mucking with the HTML DOM.
    - The HTML not only must be well-formed HTML (of course), but also must
      conform to the XHTML requirements on tags, specifically all tags must
      either be self-closing (like '<br/>') or come in matching pairs.
      Close tags are never optional.

    Note that &<number> isn't well-formed HTML; if you wanted a literal '&123',
    your HTML template would have to have '&amp;123'.
  */
  _.numBlocks = function() {
    var matches = this.htmlTemplate.match(/&\d+/g);
    return matches ? matches.length : 0;
  };
  _.html = function() {
    // Render the entire math subtree rooted at this command, as HTML.
    // Expects .createBlocks() to have been called already, since it uses the
    // .blocks array of child blocks.
    //
    // See html.test.js for example templates and intended outputs.
    //
    // Given an .htmlTemplate as described above,
    // - insert the mathquill-command-id attribute into all top-level tags,
    //   which will be used to set this.jQ in .jQize().
    //   This is straightforward:
    //     * tokenize into tags and non-tags
    //     * loop through top-level tokens:
    //         * add #cmdId attribute macro to top-level self-closing tags
    //         * else add #cmdId attribute macro to top-level open tags
    //             * skip the matching top-level close tag and all tag pairs
    //               in between
    // - for each block content marker,
    //     + replace it with the contents of the corresponding block,
    //       rendered as HTML
    //     + insert the mathquill-block-id attribute into the containing tag
    //   This is even easier, a quick regex replace, since block tags cannot
    //   contain anything besides the block content marker.
    //
    // Two notes:
    // - The outermost loop through top-level tokens should never encounter any
    //   top-level close tags, because we should have first encountered a
    //   matching top-level open tag, all inner tags should have appeared in
    //   matching pairs and been skipped, and then we should have skipped the
    //   close tag in question.
    // - All open tags should have matching close tags, which means our inner
    //   loop should always encounter a close tag and drop nesting to 0. If
    //   a close tag is missing, the loop will continue until i >= tokens.length
    //   and token becomes undefined. This will not infinite loop, even in
    //   production without pray(), because it will then TypeError on .slice().

    var cmd = this;
    var blocks = cmd.blocks;
    var cmdId = ' mathquill-command-id=' + cmd.id;
    var tokens = cmd.htmlTemplate.match(/<[^<>]+>|[^<>]+/g);

    pray('no unmatched angle brackets', tokens.join('') === this.htmlTemplate);

    // add cmdId to all top-level tags
    for (var i = 0, token = tokens[0]; token; i += 1, token = tokens[i]) {
      // top-level self-closing tags
      if (token.slice(-2) === '/>') {
        tokens[i] = token.slice(0,-2) + cmdId + '/>';
      }
      // top-level open tags
      else if (token.charAt(0) === '<') {
        pray('not an unmatched top-level close tag', token.charAt(1) !== '/');

        tokens[i] = token.slice(0,-1) + cmdId + '>';

        // skip matching top-level close tag and all tag pairs in between
        var nesting = 1;
        do {
          i += 1, token = tokens[i];
          pray('no missing close tags', token);
          // close tags
          if (token.slice(0,2) === '</') {
            nesting -= 1;
          }
          // non-self-closing open tags
          else if (token.charAt(0) === '<' && token.slice(-2) !== '/>') {
            nesting += 1;
          }
        } while (nesting > 0);
      }
    }
    return tokens.join('').replace(/>&(\d+)/g, function($0, $1) {
      return ' mathquill-block-id=' + blocks[$1].id + '>' + blocks[$1].join('html');
    });
  };

  // methods to export a string representation of the math tree
  _.latex = function() {
    return this.foldChildren(this.ctrlSeq, function(latex, child) {
      return latex + '{' + (child.latex() || ' ') + '}';
    });
  };
  _.textTemplate = [''];
  _.text = function() {
    var i = 0;
    return this.foldChildren(this.textTemplate[i], function(text, child) {
      i += 1;
      var child_text = child.text();
      if (text && this.textTemplate[i] === '('
          && child_text[0] === '(' && child_text.slice(-1) === ')')
        return text + child_text.slice(1, -1) + this.textTemplate[i];
      return text + child.text() + (this.textTemplate[i] || '');
    });
  };
});

/**
 * Lightweight command without blocks or children.
 */
var Symbol = P(MathCommand, function(_, _super) {
  _.init = function(ctrlSeq, html, text) {
    if (!text) text = ctrlSeq && ctrlSeq.length > 1 ? ctrlSeq.slice(1) : ctrlSeq;

    _super.init.call(this, ctrlSeq, html, [ text ]);
  };

  _.parser = function() { return Parser.succeed(this); };
  _.numBlocks = function() { return 0; };

  _.replaces = function(replacedFragment) {
    replacedFragment.remove();
  };
  _.createBlocks = noop;
  _.latex = function(){ return this.ctrlSeq; };
  _.text = function(){ return this.textTemplate; };
  _.placeCursor = noop;
  _.isEmpty = function(){ return true; };
});

/**
 * Children and parent of MathCommand's. Basically partitions all the
 * symbols and operators that descend (in the Math DOM tree) from
 * ancestor operators.
 */
var MathBlock = P(MathElement, function(_) {
  _.join = function(methodName) {
    return this.foldChildren('', function(fold, child) {
      return fold + child[methodName]();
    });
  };
  _.latex = function() { return this.join('latex'); };
  _.text = function() {
    return this.firstChild === this.lastChild ?
      this.firstChild.text() :
      '(' + this.join('text') + ')'
    ;
  };
  _.isEmpty = function() {
    return this.firstChild === 0 && this.lastChild === 0;
  };
  _.focus = function() {
    this.jQ.addClass('hasCursor');
    this.jQ.removeClass('empty');

    return this;
  };
  _.blur = function() {
    this.jQ.removeClass('hasCursor');
    if (this.isEmpty())
      this.jQ.addClass('empty');

    return this;
  };
});

/**
 * Math tree fragment base class.
 * Some math-tree-specific extensions to Fragment.
 */
var MathFragment = P(Fragment, function(_, _super) {
  _.init = function(first, last) {
    // just select one thing if only one argument
    _super.init.call(this, first, last || first);
    this.jQ = this.fold($(), function(jQ, child){ return child.jQ.add(jQ); });
  };
  _.latex = function() {
    return this.fold('', function(latex, el){ return latex + el.latex(); });
  };
  _.remove = function() {
    this.jQ.remove();

    this.each(function(el) {
      el.postOrder(function(desc) {
        delete MathElement[desc.id];
      });
    });

    return this.disown();
  };
});
/*********************************************
 * Root math elements with event delegation.
 ********************************************/

function createRoot(jQ, root, textbox, editable) {
  var contents = jQ.contents().detach();

  if (!textbox) {
    jQ.addClass('mathquill-rendered-math');
  }

  root.jQ = jQ.attr(mqBlockId, root.id);
  root.revert = function() {
    jQ.empty().unbind('.mathquill')
      .removeClass('mathquill-rendered-math mathquill-editable mathquill-textbox')
      .append(contents);
  };

  var cursor = root.cursor = Cursor(root);

  root.renderLatex(contents.text());

  //textarea stuff
  var textareaSpan = root.textarea = $('<span class="textarea"><textarea></textarea></span>'),
    textarea = textareaSpan.children();

  /******
   * TODO [Han]: Document this
   */
  var textareaSelectionTimeout;
  root.selectionChanged = function() {
    if (textareaSelectionTimeout === undefined) {
      textareaSelectionTimeout = setTimeout(setTextareaSelection);
    }
    forceIERedraw(jQ[0]);
  };
  function setTextareaSelection() {
    textareaSelectionTimeout = undefined;
    var latex = cursor.selection ? '$'+cursor.selection.latex()+'$' : '';
    textareaManager.select(latex);
  }

  //prevent native selection except textarea
  jQ.bind('selectstart.mathquill', function(e) {
    if (e.target !== textarea[0]) e.preventDefault();
    e.stopPropagation();
  });

  //drag-to-select event handling
  var anticursor, blink = cursor.blink;
  jQ.bind('mousedown.mathquill', function(e) {
    function mousemove(e) {
      cursor.seek($(e.target), e.pageX, e.pageY);

      if (cursor.prev !== anticursor.prev
          || cursor.parent !== anticursor.parent) {
        cursor.selectFrom(anticursor);
      }

      return false;
    }

    // docmousemove is attached to the document, so that
    // selection still works when the mouse leaves the window.
    function docmousemove(e) {
      // [Han]: i delete the target because of the way seek works.
      // it will not move the mouse to the target, but will instead
      // just seek those X and Y coordinates.  If there is a target,
      // it will try to move the cursor to document, which will not work.
      // cursor.seek needs to be refactored.
      delete e.target;

      return mousemove(e);
    }

    function mouseup(e) {
      anticursor = undefined;
      cursor.blink = blink;
      if (!cursor.selection) {
        if (editable) {
          cursor.show();
        }
        else {
          textareaSpan.detach();
        }
      }

      // delete the mouse handlers now that we're not dragging anymore
      jQ.unbind('mousemove', mousemove);
      $(e.target.ownerDocument).unbind('mousemove', docmousemove).unbind('mouseup', mouseup);
    }

    setTimeout(function() { textarea.focus(); });
      // preventDefault won't prevent focus on mousedown in IE<9
      // that means immediately after this mousedown, whatever was
      // mousedown-ed will receive focus
      // http://bugs.jquery.com/ticket/10345

    cursor.blink = noop;
    cursor.seek($(e.target), e.pageX, e.pageY);

    anticursor = {parent: cursor.parent, prev: cursor.prev, next: cursor.next};

    if (!editable) jQ.prepend(textareaSpan);

    jQ.mousemove(mousemove);
    $(e.target.ownerDocument).mousemove(docmousemove).mouseup(mouseup);

    return false;
  });

  if (!editable) {
    var textareaManager = manageTextarea(textarea, { container: jQ });
    jQ.bind('cut paste', false).bind('copy', setTextareaSelection)
      .prepend('<span class="selectable">$'+root.latex()+'$</span>');
    textarea.blur(function() {
      cursor.clearSelection();
      setTimeout(detach); //detaching during blur explodes in WebKit
    });
    function detach() {
      textareaSpan.detach();
    }
    return;
  }

  var textareaManager = manageTextarea(textarea, {
    container: jQ,
    key: function(key, evt) {
      cursor.parent.bubble('onKey', key, evt);
    },
    text: function(text) {
      cursor.parent.bubble('onText', text);
    },
    cut: function(e) {
      if (cursor.selection) {
        setTimeout(function() {
          cursor.prepareEdit();
          cursor.parent.bubble('redraw');
        });
      }

      e.stopPropagation();
    },
    paste: function(text) {
      // FIXME HACK the parser in RootTextBlock needs to be moved to
      // Cursor::writeLatex or something so this'll work with
      // MathQuill textboxes
      if (text.slice(0,1) === '$' && text.slice(-1) === '$') {
        text = text.slice(1, -1);
      }
      else {
        text = '\\text{' + text + '}';
      }

      cursor.writeLatex(text).show();
    }
  });

  jQ.prepend(textareaSpan);

  //root CSS classes
  jQ.addClass('mathquill-editable');
  if (textbox)
    jQ.addClass('mathquill-textbox');

  //focus and blur handling
  textarea.focus(function(e) {
    if (!cursor.parent)
      cursor.appendTo(root);
    cursor.parent.jQ.addClass('hasCursor');
    if (cursor.selection) {
      cursor.selection.jQ.removeClass('blur');
      setTimeout(root.selectionChanged); //re-select textarea contents after tabbing away and back
    }
    else
      cursor.show();
    e.stopPropagation();
  }).blur(function(e) {
    cursor.hide().parent.blur();
    if (cursor.selection)
      cursor.selection.jQ.addClass('blur');
    e.stopPropagation();
  });

  jQ.bind('focus.mathquill blur.mathquill', function(e) {
    textarea.trigger(e);
  }).blur();
}

var RootMathBlock = P(MathBlock, function(_, _super) {
  _.latex = function() {
    return _super.latex.call(this).replace(/(\\[a-z]+) (?![a-z])/ig,'$1');
  };
  _.text = function() {
    return this.foldChildren('', function(text, child) {
      return text + child.text();
    });
  };
  _.renderLatex = function(latex) {
    var jQ = this.jQ;

    jQ.children().slice(1).remove();
    this.firstChild = this.lastChild = 0;

    this.cursor.appendTo(this).writeLatex(latex);
  };
  _.onKey = function(key, e) {
    switch (key) {
    case 'Ctrl-Shift-Backspace':
    case 'Ctrl-Backspace':
      while (this.cursor.prev || this.cursor.selection) {
        this.cursor.backspace();
      }
      break;

    case 'Shift-Backspace':
    case 'Backspace':
      this.cursor.backspace();
      break;

    // Tab or Esc -> go one block right if it exists, else escape right.
    case 'Esc':
    case 'Tab':
    case 'Spacebar':
      var parent = this.cursor.parent;
      // cursor is in root editable, continue default
      if (parent === this.cursor.root) {
        if (key === 'Spacebar') e.preventDefault();
        return;
      }

      this.cursor.prepareMove();
      if (parent.next) {
        // go one block right
        this.cursor.prependTo(parent.next);
      } else {
        // get out of the block
        this.cursor.insertAfter(parent.parent);
      }
      break;

    // Shift-Tab -> go one block left if it exists, else escape left.
    case 'Shift-Tab':
    case 'Shift-Esc':
    case 'Shift-Spacebar':
      var parent = this.cursor.parent;
      //cursor is in root editable, continue default
      if (parent === this.cursor.root) {
        if (key === 'Shift-Spacebar') e.preventDefault();
        return;
      }

      this.cursor.prepareMove();
      if (parent.prev) {
        // go one block left
        this.cursor.appendTo(parent.prev);
      } else {
        //get out of the block
        this.cursor.insertBefore(parent.parent);
      }
      break;

    // Prevent newlines from showing up
    case 'Enter': break;


    // End -> move to the end of the current block.
    case 'End':
      this.cursor.prepareMove().appendTo(this.cursor.parent);
      break;

    // Ctrl-End -> move all the way to the end of the root block.
    case 'Ctrl-End':
      this.cursor.prepareMove().appendTo(this);
      break;

    // Shift-End -> select to the end of the current block.
    case 'Shift-End':
      while (this.cursor.next) {
        this.cursor.selectRight();
      }
      break;

    // Ctrl-Shift-End -> select to the end of the root block.
    case 'Ctrl-Shift-End':
      while (this.cursor.next || this.cursor.parent !== this) {
        this.cursor.selectRight();
      }
      break;

    // Home -> move to the start of the root block or the current block.
    case 'Home':
      this.cursor.prepareMove().prependTo(this.cursor.parent);
      break;

    // Ctrl-Home -> move to the start of the current block.
    case 'Ctrl-Home':
      this.cursor.prepareMove().prependTo(this);
      break;

    // Shift-Home -> select to the start of the current block.
    case 'Shift-Home':
      while (this.cursor.prev) {
        this.cursor.selectLeft();
      }
      break;

    // Ctrl-Shift-Home -> move to the start of the root block.
    case 'Ctrl-Shift-Home':
      while (this.cursor.prev || this.cursor.parent !== this) {
        this.cursor.selectLeft();
      }
      break;

    case 'Left': this.cursor.moveLeft(); break;
    case 'Shift-Left': this.cursor.selectLeft(); break;
    case 'Ctrl-Left': break;

    case 'Right': this.cursor.moveRight(); break;
    case 'Shift-Right': this.cursor.selectRight(); break;
    case 'Ctrl-Right': break;

    case 'Up': this.cursor.moveUp(); break;
    case 'Down': this.cursor.moveDown(); break;

    case 'Shift-Up':
      if (this.cursor.prev) {
        while (this.cursor.prev) this.cursor.selectLeft();
      } else {
        this.cursor.selectLeft();
      }

    case 'Shift-Down':
      if (this.cursor.next) {
        while (this.cursor.next) this.cursor.selectRight();
      }
      else {
        this.cursor.selectRight();
      }

    case 'Ctrl-Up': break;
    case 'Ctrl-Down': break;

    case 'Ctrl-Shift-Del':
    case 'Ctrl-Del':
      while (this.cursor.next || this.cursor.selection) {
        this.cursor.deleteForward();
      }
      break;

    case 'Shift-Del':
    case 'Del':
      this.cursor.deleteForward();
      break;

    case 'Meta-A':
    case 'Ctrl-A':
      //so not stopPropagation'd at RootMathCommand
      if (this !== this.cursor.root) return;

      this.cursor.prepareMove().appendTo(this);
      while (this.cursor.prev) this.cursor.selectLeft();
      break;

    default:
      return false;
    }
    e.preventDefault();
    return false;
  };
  _.onText = function(ch) {
    this.cursor.write(ch);
    return false;
  };
});

var RootMathCommand = P(MathCommand, function(_, _super) {
  _.init = function(cursor) {
    _super.init.call(this, '$');
    this.cursor = cursor;
  };
  _.htmlTemplate = '<span class="mathquill-rendered-math">&0</span>';
  _.createBlocks = function() {
    this.firstChild =
    this.lastChild =
      RootMathBlock();

    this.blocks = [ this.firstChild ];

    this.firstChild.parent = this;

    var cursor = this.firstChild.cursor = this.cursor;
    this.firstChild.onText = function(ch) {
      if (ch !== '$' || cursor.parent !== this)
        cursor.write(ch);
      else if (this.isEmpty()) {
        cursor.insertAfter(this.parent).backspace()
          .insertNew(VanillaSymbol('\\$','$')).show();
      }
      else if (!cursor.next)
        cursor.insertAfter(this.parent);
      else if (!cursor.prev)
        cursor.insertBefore(this.parent);
      else
        cursor.write(ch);

      return false;
    };
  };
  _.latex = function() {
    return '$' + this.firstChild.latex() + '$';
  };
});

var RootTextBlock = P(MathBlock, function(_) {
  _.renderLatex = function(latex) {
    var self = this
    var cursor = self.cursor;
    self.jQ.children().slice(1).remove();
    self.firstChild = self.lastChild = 0;
    cursor.show().appendTo(self);

    var regex = Parser.regex;
    var string = Parser.string;
    var eof = Parser.eof;
    var all = Parser.all;

    // Parser RootMathCommand
    var mathMode = string('$').then(latexMathParser)
      // because TeX is insane, math mode doesn't necessarily
      // have to end.  So we allow for the case that math mode
      // continues to the end of the stream.
      .skip(string('$').or(eof))
      .map(function(block) {
        // HACK FIXME: this shouldn't have to have access to cursor
        var rootMathCommand = RootMathCommand(cursor);

        rootMathCommand.createBlocks();
        var rootMathBlock = rootMathCommand.firstChild;
        block.children().adopt(rootMathBlock, 0, 0);

        return rootMathCommand;
      })
    ;

    var escapedDollar = string('\\$').result('$');
    var textChar = escapedDollar.or(regex(/^[^$]/)).map(VanillaSymbol);
    var latexText = mathMode.or(textChar).many();
    var commands = latexText.skip(eof).or(all.result(false)).parse(latex);

    if (commands) {
      for (var i = 0; i < commands.length; i += 1) {
        commands[i].adopt(self, self.lastChild, 0);
      }

      var html = self.join('html');
      MathElement.jQize(html).appendTo(self.jQ);

      this.finalizeInsert();
    }
  };
  _.onKey = RootMathBlock.prototype.onKey;
  _.onText = function(ch) {
    this.cursor.prepareEdit();
    if (ch === '$')
      this.cursor.insertNew(RootMathCommand(this.cursor));
    else
      this.cursor.insertNew(VanillaSymbol(ch));

    return false;
  };
});
/***************************
 * Commands and Operators.
 **************************/

var CharCmds = {}, LatexCmds = {}; //single character commands, LaTeX commands

var scale, // = function(jQ, x, y) { ... }
//will use a CSS 2D transform to scale the jQuery-wrapped HTML elements,
//or the filter matrix transform fallback for IE 5.5-8, or gracefully degrade to
//increasing the fontSize to match the vertical Y scaling factor.

//ideas from http://github.com/louisremi/jquery.transform.js
//see also http://msdn.microsoft.com/en-us/library/ms533014(v=vs.85).aspx

  forceIERedraw = noop,
  div = document.createElement('div'),
  div_style = div.style,
  transformPropNames = {
    transform:1,
    WebkitTransform:1,
    MozTransform:1,
    OTransform:1,
    msTransform:1
  },
  transformPropName;

for (var prop in transformPropNames) {
  if (prop in div_style) {
    transformPropName = prop;
    break;
  }
}

if (transformPropName) {
  scale = function(jQ, x, y) {
    jQ.css(transformPropName, 'scale('+x+','+y+')');
  };
}
else if ('filter' in div_style) { //IE 6, 7, & 8 fallback, see https://github.com/laughinghan/mathquill/wiki/Transforms
  forceIERedraw = function(el){ el.className = el.className; };
  scale = function(jQ, x, y) { //NOTE: assumes y > x
    x /= (1+(y-1)/2);
    jQ.css('fontSize', y + 'em');
    if (!jQ.hasClass('matrixed-container')) {
      jQ.addClass('matrixed-container')
      .wrapInner('<span class="matrixed"></span>');
    }
    var innerjQ = jQ.children()
    .css('filter', 'progid:DXImageTransform.Microsoft'
        + '.Matrix(M11=' + x + ",SizingMethod='auto expand')"
    );
    function calculateMarginRight() {
      jQ.css('marginRight', (innerjQ.width()-1)*(x-1)/x + 'px');
    }
    calculateMarginRight();
    var intervalId = setInterval(calculateMarginRight);
    $(window).load(function() {
      clearTimeout(intervalId);
      calculateMarginRight();
    });
  };
}
else {
  scale = function(jQ, x, y) {
    jQ.css('fontSize', y + 'em');
  };
}

var Style = P(MathCommand, function(_, _super) {
  _.init = function(ctrlSeq, tagName, attrs) {
    _super.init.call(this, ctrlSeq, '<'+tagName+' '+attrs+'>&0</'+tagName+'>');
  };
});

//fonts
LatexCmds.mathrm = bind(Style, '\\mathrm', 'span', 'class="roman font"');
LatexCmds.mathit = bind(Style, '\\mathit', 'i', 'class="font"');
LatexCmds.mathbf = bind(Style, '\\mathbf', 'b', 'class="font"');
LatexCmds.mathsf = bind(Style, '\\mathsf', 'span', 'class="sans-serif font"');
LatexCmds.mathtt = bind(Style, '\\mathtt', 'span', 'class="monospace font"');
//text-decoration
LatexCmds.underline = bind(Style, '\\underline', 'span', 'class="non-leaf underline"');
LatexCmds.overline = LatexCmds.bar = bind(Style, '\\overline', 'span', 'class="non-leaf overline"');
LatexCmds.overleftrightarrow = LatexCmds.bar = bind(Style, '\\overleftrightarrow', 'span', 'class="non-leaf overleftrightarrow"');
LatexCmds.overrightarrow = LatexCmds.bar = bind(Style, '\\overrightarrow', 'span', 'class="non-leaf overrightarrow"');

var SupSub = P(MathCommand, function(_, _super) {
  _.init = function(ctrlSeq, tag, text) {
    _super.init.call(this, ctrlSeq, '<'+tag+' class="non-leaf">&0</'+tag+'>', [ text ]);
  };
  _.finalizeTree = function() {
    //TODO: use inheritance
    pray('SupSub is only _ and ^',
      this.ctrlSeq === '^' || this.ctrlSeq === '_'
    );

    if (this.ctrlSeq === '_') {
      this.down = this.firstChild;
      this.firstChild.up = insertBeforeUnlessAtEnd;
    }
    else {
      this.up = this.firstChild;
      this.firstChild.down = insertBeforeUnlessAtEnd;
    }
    function insertBeforeUnlessAtEnd(cursor) {
      // cursor.insertBefore(cmd), unless cursor at the end of block, and every
      // ancestor cmd is at the end of every ancestor block
      var cmd = this.parent, ancestorCmd = cursor;
      do {
        if (ancestorCmd.next) {
          cursor.insertBefore(cmd);
          return false;
        }
        ancestorCmd = ancestorCmd.parent.parent;
      } while (ancestorCmd !== cmd);
      cursor.insertAfter(cmd);
      return false;
    }
  };
  _.latex = function() {
    var latex = this.firstChild.latex();
    if (latex.length === 1)
      return this.ctrlSeq + latex;
    else
      return this.ctrlSeq + '{' + (latex || ' ') + '}';
  };
  _.redraw = function() {
    if (this.prev)
      this.prev.respace();
    //SupSub::respace recursively calls respace on all the following SupSubs
    //so if prev is a SupSub, no need to call respace on this or following nodes
    if (!(this.prev instanceof SupSub)) {
      this.respace();
      //and if next is a SupSub, then this.respace() will have already called
      //this.next.respace()
      if (this.next && !(this.next instanceof SupSub))
        this.next.respace();
    }
  };
  _.respace = function() {
    if (
      this.prev.ctrlSeq === '\\int ' || (
        this.prev instanceof SupSub && this.prev.ctrlSeq != this.ctrlSeq
        && this.prev.prev && this.prev.prev.ctrlSeq === '\\int '
      )
    ) {
      if (!this.limit) {
        this.limit = true;
        this.jQ.addClass('limit');
      }
    }
    else {
      if (this.limit) {
        this.limit = false;
        this.jQ.removeClass('limit');
      }
    }

    this.respaced = this.prev instanceof SupSub && this.prev.ctrlSeq != this.ctrlSeq && !this.prev.respaced;
    if (this.respaced) {
      var fontSize = +this.jQ.css('fontSize').slice(0,-2),
        prevWidth = this.prev.jQ.outerWidth(),
        thisWidth = this.jQ.outerWidth();
      this.jQ.css({
        left: (this.limit && this.ctrlSeq === '_' ? -.25 : 0) - prevWidth/fontSize + 'em',
        marginRight: .1 - min(thisWidth, prevWidth)/fontSize + 'em'
          //1px extra so it doesn't wrap in retarded browsers (Firefox 2, I think)
      });
    }
    else if (this.limit && this.ctrlSeq === '_') {
      this.jQ.css({
        left: '-.25em',
        marginRight: ''
      });
    }
    else {
      this.jQ.css({
        left: '',
        marginRight: ''
      });
    }

    if (this.next instanceof SupSub)
      this.next.respace();

    return this;
  };
});

LatexCmds.subscript =
LatexCmds._ = bind(SupSub, '_', 'sub', '_');

LatexCmds.superscript =
LatexCmds.supscript =
LatexCmds['^'] = bind(SupSub, '^', 'sup', '**');

var Fraction =
LatexCmds.frac =
LatexCmds.dfrac =
LatexCmds.cfrac =
LatexCmds.fraction = P(MathCommand, function(_, _super) {
  _.ctrlSeq = '\\frac';
  _.htmlTemplate =
      '<span class="fraction non-leaf">'
    +   '<span class="numerator">&0</span>'
    +   '<span class="denominator">&1</span>'
    +   '<span style="display:inline-block;width:0">&nbsp;</span>'
    + '</span>'
  ;
  _.textTemplate = ['(', '/', ')'];
  _.finalizeTree = function() {
    this.up = this.lastChild.up = this.firstChild;
    this.down = this.firstChild.down = this.lastChild;
  };
});

var LiveFraction =
LatexCmds.over =
CharCmds['/'] = P(Fraction, function(_, _super) {
  _.createBefore = function(cursor) {
    if (!this.replacedFragment) {
      var prev = cursor.prev;
      while (prev &&
        !(
          prev instanceof BinaryOperator ||
          prev instanceof TextBlock ||
          prev instanceof BigSymbol
        ) //lookbehind for operator
      )
        prev = prev.prev;

      if (prev instanceof BigSymbol && prev.next instanceof SupSub) {
        prev = prev.next;
        if (prev.next instanceof SupSub && prev.next.ctrlSeq != prev.ctrlSeq)
          prev = prev.next;
      }

      if (prev !== cursor.prev) {
        this.replaces(MathFragment(prev.next || cursor.parent.firstChild, cursor.prev));
        cursor.prev = prev;
      }
    }
    _super.createBefore.call(this, cursor);
  };
});

var SquareRoot =
LatexCmds.sqrt =
LatexCmds['√'] = P(MathCommand, function(_, _super) {
  _.ctrlSeq = '\\sqrt';
  _.htmlTemplate =
      '<span class="non-leaf">'
    +   '<span class="scaled sqrt-prefix">&radic;</span>'
    +   '<span class="non-leaf sqrt-stem">&0</span>'
    + '</span>'
  ;
  _.textTemplate = ['sqrt(', ')'];
  _.parser = function() {
    return latexMathParser.optBlock.then(function(optBlock) {
      return latexMathParser.block.map(function(block) {
        var nthroot = NthRoot();
        nthroot.blocks = [ optBlock, block ];
        optBlock.adopt(nthroot, 0, 0);
        block.adopt(nthroot, optBlock, 0);
        return nthroot;
      });
    }).or(_super.parser.call(this));
  };
  _.redraw = function() {
    var block = this.lastChild.jQ;
    scale(block.prev(), 1, block.innerHeight()/+block.css('fontSize').slice(0,-2) - .1);
  };
});


var NthRoot =
LatexCmds.nthroot = P(SquareRoot, function(_, _super) {
  _.htmlTemplate =
      '<sup class="nthroot non-leaf">&0</sup>'
    + '<span class="scaled">'
    +   '<span class="sqrt-prefix scaled">&radic;</span>'
    +   '<span class="sqrt-stem non-leaf">&1</span>'
    + '</span>'
  ;
  _.textTemplate = ['sqrt[', '](', ')'];
  _.latex = function() {
    return '\\sqrt['+this.firstChild.latex()+']{'+this.lastChild.latex()+'}';
  };
});

// Round/Square/Curly/Angle Brackets (aka Parens/Brackets/Braces)
var Bracket = P(MathCommand, function(_, _super) {
  _.init = function(open, close, ctrlSeq, end) {
    _super.init.call(this, '\\left'+ctrlSeq,
        '<span class="non-leaf">'
      +   '<span class="scaled paren">'+open+'</span>'
      +   '<span class="non-leaf">&0</span>'
      +   '<span class="scaled paren">'+close+'</span>'
      + '</span>',
      [open, close]);
    this.end = '\\right'+end;
  };
  _.jQadd = function() {
    _super.jQadd.apply(this, arguments);
    var jQ = this.jQ;
    this.bracketjQs = jQ.children(':first').add(jQ.children(':last'));
  };
  _.latex = function() {
    return this.ctrlSeq + this.firstChild.latex() + this.end;
  };
  _.redraw = function() {
    var blockjQ = this.firstChild.jQ;

    var height = blockjQ.outerHeight()/+blockjQ.css('fontSize').slice(0,-2);

    scale(this.bracketjQs, min(1 + .2*(height - 1), 1.2), 1.05*height);
  };
});

LatexCmds.left = P(MathCommand, function(_) {
  _.parser = function() {
    var regex = Parser.regex;
    var string = Parser.string;
    var regex = Parser.regex;
    var succeed = Parser.succeed;
    var block = latexMathParser.block;
    var optWhitespace = Parser.optWhitespace;

    return optWhitespace.then(regex(/^(?:[([|]|\\\{)/))
      .then(function(open) {
        if (open.charAt(0) === '\\') open = open.slice(1);

        var cmd = CharCmds[open]();

        return latexMathParser
          .map(function (block) {
            cmd.blocks = [ block ];
            block.adopt(cmd, 0, 0);
          })
          .then(string('\\right'))
          .skip(optWhitespace)
          .then(regex(/^(?:[\])|]|\\\})/))
          .then(function(close) {
            if (close.slice(-1) !== cmd.end.slice(-1)) {
              return Parser.fail('open doesn\'t match close');
            }

            return succeed(cmd);
          })
        ;
      })
    ;
  };
});

LatexCmds.right = P(MathCommand, function(_) {
  _.parser = function() {
    return Parser.fail('unmatched \\right');
  };
});

LatexCmds.lbrace =
CharCmds['{'] = bind(Bracket, '{', '}', '\\{', '\\}');
LatexCmds.langle =
LatexCmds.lang = bind(Bracket, '&lang;','&rang;','\\langle ','\\rangle ');

// Closing bracket matching opening bracket above
var CloseBracket = P(Bracket, function(_, _super) {
  _.createBefore = function(cursor) {
    // if I'm at the end of my parent who is a matching open-paren,
    // and I am not replacing a selection fragment, don't create me,
    // just put cursor after my parent
    if (!cursor.next && cursor.parent.parent && cursor.parent.parent.end === this.end && !this.replacedFragment)
      cursor.insertAfter(cursor.parent.parent);
    else
      _super.createBefore.call(this, cursor);
  };
  _.placeCursor = function(cursor) {
    this.firstChild.blur();
    cursor.insertAfter(this);
  };
});

LatexCmds.rbrace =
CharCmds['}'] = bind(CloseBracket, '{','}','\\{','\\}');
LatexCmds.rangle =
LatexCmds.rang = bind(CloseBracket, '&lang;','&rang;','\\langle ','\\rangle ');

var parenMixin = function(_, _super) {
  _.init = function(open, close) {
    _super.init.call(this, open, close, open, close);
  };
};

var Paren = P(Bracket, parenMixin);

LatexCmds.lparen =
CharCmds['('] = bind(Paren, '(', ')');
LatexCmds.lbrack =
LatexCmds.lbracket =
CharCmds['['] = bind(Paren, '[', ']');

var CloseParen = P(CloseBracket, parenMixin);

LatexCmds.rparen =
CharCmds[')'] = bind(CloseParen, '(', ')');
LatexCmds.rbrack =
LatexCmds.rbracket =
CharCmds[']'] = bind(CloseParen, '[', ']');

var Pipes =
LatexCmds.lpipe =
LatexCmds.rpipe =
CharCmds['|'] = P(Paren, function(_, _super) {
  _.init = function() {
    _super.init.call(this, '|', '|');
  }

  _.createBefore = CloseBracket.prototype.createBefore;
});

var TextBlock =
CharCmds.$ =
LatexCmds.text =
LatexCmds.textnormal =
LatexCmds.textrm =
LatexCmds.textup =
LatexCmds.textmd = P(MathCommand, function(_, _super) {
  _.ctrlSeq = '\\text';
  _.htmlTemplate = '<span class="text">&0</span>';
  _.replaces = function(replacedText) {
    if (replacedText instanceof MathFragment)
      this.replacedText = replacedText.remove().jQ.text();
    else if (typeof replacedText === 'string')
      this.replacedText = replacedText;
  };
  _.textTemplate = ['"', '"'];
  _.parser = function() {
    // TODO: correctly parse text mode
    var string = Parser.string;
    var regex = Parser.regex;
    var optWhitespace = Parser.optWhitespace;
    return optWhitespace
      .then(string('{')).then(regex(/^[^}]*/)).skip(string('}'))
      .map(function(text) {
        var cmd = TextBlock();
        cmd.createBlocks();
        var block = cmd.firstChild;
        for (var i = 0; i < text.length; i += 1) {
          var ch = VanillaSymbol(text.charAt(i));
          ch.adopt(block, block.lastChild, 0);
        }
        return cmd;
      })
    ;
  };
  _.createBlocks = function() {
    //FIXME: another possible Law of Demeter violation, but this seems much cleaner, like it was supposed to be done this way
    this.firstChild =
    this.lastChild =
      InnerTextBlock();

    this.blocks = [ this.firstChild ];

    this.firstChild.parent = this;
  };
  _.finalizeInsert = function() {
    //FIXME HACK blur removes the TextBlock
    this.firstChild.blur = function() { delete this.blur; return this; };
    _super.finalizeInsert.call(this);
  };
  _.createBefore = function(cursor) {
    _super.createBefore.call(this, this.cursor = cursor);

    if (this.replacedText)
      for (var i = 0; i < this.replacedText.length; i += 1)
        this.write(this.replacedText.charAt(i));
  };
  _.write = function(ch) {
    this.cursor.insertNew(VanillaSymbol(ch));
  };
  _.onKey = function(key, e) {
    //backspace and delete and ends of block don't unwrap
    if (!this.cursor.selection &&
      (
        (key === 'Backspace' && !this.cursor.prev) ||
        (key === 'Del' && !this.cursor.next)
      )
    ) {
      if (this.isEmpty())
        this.cursor.insertAfter(this);

      return false;
    }
  };
  _.onText = function(ch) {
    this.cursor.prepareEdit();
    if (ch !== '$')
      this.write(ch);
    else if (this.isEmpty())
      this.cursor.insertAfter(this).backspace().insertNew(VanillaSymbol('\\$','$'));
    else if (!this.cursor.next)
      this.cursor.insertAfter(this);
    else if (!this.cursor.prev)
      this.cursor.insertBefore(this);
    else { //split apart
      var next = TextBlock(MathFragment(this.cursor.next, this.firstChild.lastChild));
      next.placeCursor = function(cursor) { //FIXME HACK: pretend no prev so they don't get merged
        this.prev = 0;
        delete this.placeCursor;
        this.placeCursor(cursor);
      };
      next.firstChild.focus = function(){ return this; };
      this.cursor.insertAfter(this).insertNew(next);
      next.prev = this;
      this.cursor.insertBefore(next);
      delete next.firstChild.focus;
    }
    return false;
  };
});

var InnerTextBlock = P(MathBlock, function(_, _super) {
  _.blur = function() {
    this.jQ.removeClass('hasCursor');
    if (this.isEmpty()) {
      var textblock = this.parent, cursor = textblock.cursor;
      if (cursor.parent === this)
        this.jQ.addClass('empty');
      else {
        cursor.hide();
        textblock.remove();
        if (cursor.next === textblock)
          cursor.next = textblock.next;
        else if (cursor.prev === textblock)
          cursor.prev = textblock.prev;

        cursor.show().parent.bubble('redraw');
      }
    }
    return this;
  };
  _.focus = function() {
    _super.focus.call(this);

    var textblock = this.parent;
    if (textblock.next.ctrlSeq === textblock.ctrlSeq) { //TODO: seems like there should be a better way to move MathElements around
      var innerblock = this,
        cursor = textblock.cursor,
        next = textblock.next.firstChild;

      next.eachChild(function(child){
        child.parent = innerblock;
        child.jQ.appendTo(innerblock.jQ);
      });

      if (this.lastChild)
        this.lastChild.next = next.firstChild;
      else
        this.firstChild = next.firstChild;

      next.firstChild.prev = this.lastChild;
      this.lastChild = next.lastChild;

      next.parent.remove();

      if (cursor.prev)
        cursor.insertAfter(cursor.prev);
      else
        cursor.prependTo(this);

      cursor.parent.bubble('redraw');
    }
    else if (textblock.prev.ctrlSeq === textblock.ctrlSeq) {
      var cursor = textblock.cursor;
      if (cursor.prev)
        textblock.prev.firstChild.focus();
      else
        cursor.appendTo(textblock.prev.firstChild);
    }
    return this;
  };
});


function makeTextBlock(latex, tagName, attrs) {
  return P(TextBlock, {
    ctrlSeq: latex,
    htmlTemplate: '<'+tagName+' '+attrs+'>&0</'+tagName+'>'
  });
}

LatexCmds.em = LatexCmds.italic = LatexCmds.italics =
LatexCmds.emph = LatexCmds.textit = LatexCmds.textsl =
  makeTextBlock('\\textit', 'i', 'class="text"');
LatexCmds.strong = LatexCmds.bold = LatexCmds.textbf =
  makeTextBlock('\\textbf', 'b', 'class="text"');
LatexCmds.sf = LatexCmds.textsf =
  makeTextBlock('\\textsf', 'span', 'class="sans-serif text"');
LatexCmds.tt = LatexCmds.texttt =
  makeTextBlock('\\texttt', 'span', 'class="monospace text"');
LatexCmds.textsc =
  makeTextBlock('\\textsc', 'span', 'style="font-variant:small-caps" class="text"');
LatexCmds.uppercase =
  makeTextBlock('\\uppercase', 'span', 'style="text-transform:uppercase" class="text"');
LatexCmds.lowercase =
  makeTextBlock('\\lowercase', 'span', 'style="text-transform:lowercase" class="text"');

// input box to type a variety of LaTeX commands beginning with a backslash
var LatexCommandInput =
CharCmds['\\'] = P(MathCommand, function(_, _super) {
  _.ctrlSeq = '\\';
  _.replaces = function(replacedFragment) {
    this._replacedFragment = replacedFragment.disown();
    this.isEmpty = function() { return false; };
  };
  _.htmlTemplate = '<span class="latex-command-input non-leaf">\\<span>&0</span></span>';
  _.textTemplate = ['\\'];
  _.createBlocks = function() {
    _super.createBlocks.call(this);
    this.firstChild.focus = function() {
      this.parent.jQ.addClass('hasCursor');
      if (this.isEmpty())
        this.parent.jQ.removeClass('empty');

      return this;
    };
    this.firstChild.blur = function() {
      this.parent.jQ.removeClass('hasCursor');
      if (this.isEmpty())
        this.parent.jQ.addClass('empty');

      return this;
    };
  };
  _.createBefore = function(cursor) {
    _super.createBefore.call(this, cursor);
    this.cursor = cursor.appendTo(this.firstChild);
    if (this._replacedFragment) {
      var el = this.jQ[0];
      this.jQ =
        this._replacedFragment.jQ.addClass('blur').bind(
          'mousedown mousemove', //FIXME: is monkey-patching the mousedown and mousemove handlers the right way to do this?
          function(e) {
            $(e.target = el).trigger(e);
            return false;
          }
        ).insertBefore(this.jQ).add(this.jQ);
    }
  };
  _.latex = function() {
    return '\\' + this.firstChild.latex() + ' ';
  };
  _.onKey = function(key, e) {
    if (key === 'Tab' || key === 'Enter' || key === 'Spacebar') {
      this.renderCommand();
      e.preventDefault();
      return false;
    }
  };
  _.onText = function(ch) {
    if (ch.match(/[a-z]/i)) {
      this.cursor.prepareEdit();
      this.cursor.insertNew(VanillaSymbol(ch));
      return false;
    }
    this.renderCommand();
    if (ch === '\\' && this.firstChild.isEmpty())
      return false;
  };
  _.renderCommand = function() {
    this.jQ = this.jQ.last();
    this.remove();
    if (this.next) {
      this.cursor.insertBefore(this.next);
    } else {
      this.cursor.appendTo(this.parent);
    }

    var latex = this.firstChild.latex(), cmd;
    if (!latex) latex = 'backslash';
    this.cursor.insertCmd(latex, this._replacedFragment);
  };
});

var Binomial =
LatexCmds.binom =
LatexCmds.binomial = P(MathCommand, function(_, _super) {
  _.ctrlSeq = '\\binom';
  _.htmlTemplate =
      '<span class="paren scaled">(</span>'
    + '<span class="non-leaf">'
    +   '<span class="array non-leaf">'
    +     '<span>&0</span>'
    +     '<span>&1</span>'
    +   '</span>'
    + '</span>'
    + '<span class="paren scaled">)</span>'
  ;
  _.textTemplate = ['choose(',',',')'];
  _.redraw = function() {
    var blockjQ = this.jQ.eq(1);

    var height = blockjQ.outerHeight()/+blockjQ.css('fontSize').slice(0,-2);

    var parens = this.jQ.filter('.paren');
    scale(parens, min(1 + .2*(height - 1), 1.2), 1.05*height);
  };
});

var Choose =
LatexCmds.choose = P(Binomial, function(_) {
  _.createBefore = LiveFraction.prototype.createBefore;
});

var Vector =
LatexCmds.vector = P(MathCommand, function(_, _super) {
  _.ctrlSeq = '\\vector';
  _.htmlTemplate = '<span class="array"><span>&0</span></span>';
  _.latex = function() {
    return '\\begin{matrix}' + this.foldChildren([], function(latex, child) {
      latex.push(child.latex());
      return latex;
    }).join('\\\\') + '\\end{matrix}';
  };
  _.text = function() {
    return '[' + this.foldChildren([], function(text, child) {
      text.push(child.text());
      return text;
    }).join() + ']';
  }
  _.createBefore = function(cursor) {
    _super.createBefore.call(this, this.cursor = cursor);
  };
  _.onKey = function(key, e) {
    var currentBlock = this.cursor.parent;

    if (currentBlock.parent === this) {
      if (key === 'Enter') { //enter
        var newBlock = MathBlock();
        newBlock.parent = this;
        newBlock.jQ = $('<span></span>')
          .attr(mqBlockId, newBlock.id)
          .insertAfter(currentBlock.jQ);
        if (currentBlock.next)
          currentBlock.next.prev = newBlock;
        else
          this.lastChild = newBlock;

        newBlock.next = currentBlock.next;
        currentBlock.next = newBlock;
        newBlock.prev = currentBlock;
        this.bubble('redraw').cursor.appendTo(newBlock);

        e.preventDefault();
        return false;
      }
      else if (key === 'Tab' && !currentBlock.next) {
        if (currentBlock.isEmpty()) {
          if (currentBlock.prev) {
            this.cursor.insertAfter(this);
            delete currentBlock.prev.next;
            this.lastChild = currentBlock.prev;
            currentBlock.jQ.remove();
            this.bubble('redraw');

            e.preventDefault();
            return false;
          }
          else
            return;
        }

        var newBlock = MathBlock();
        newBlock.parent = this;
        newBlock.jQ = $('<span></span>').attr(mqBlockId, newBlock.id).appendTo(this.jQ);
        this.lastChild = newBlock;
        currentBlock.next = newBlock;
        newBlock.prev = currentBlock;
        this.bubble('redraw').cursor.appendTo(newBlock);

        e.preventDefault();
        return false;
      }
      else if (e.which === 8) { //backspace
        if (currentBlock.isEmpty()) {
          if (currentBlock.prev) {
            this.cursor.appendTo(currentBlock.prev)
            currentBlock.prev.next = currentBlock.next;
          }
          else {
            this.cursor.insertBefore(this);
            this.firstChild = currentBlock.next;
          }

          if (currentBlock.next)
            currentBlock.next.prev = currentBlock.prev;
          else
            this.lastChild = currentBlock.prev;

          currentBlock.jQ.remove();
          if (this.isEmpty())
            this.cursor.deleteForward();
          else
            this.bubble('redraw');

          e.preventDefault();
          return false;
        }
        else if (!this.cursor.prev) {
          e.preventDefault();
          return false;
        }
      }
    }
  };
});

LatexCmds.editable = P(RootMathCommand, function(_, _super) {
  _.init = function() {
    MathCommand.prototype.init.call(this, '\\editable');
  };

  _.jQadd = function() {
    var self = this;
    // FIXME: this entire method is a giant hack to get around
    // having to call createBlocks, and createRoot expecting to
    // render the contents' LaTeX. Both need to be refactored.
    _super.jQadd.apply(self, arguments);
    var block = self.firstChild.disown();
    var blockjQ = self.jQ.children().detach();

    self.firstChild =
    self.lastChild =
      RootMathBlock();

    self.blocks = [ self.firstChild ];

    self.firstChild.parent = self;

    createRoot(self.jQ, self.firstChild, false, true);
    self.cursor = self.firstChild.cursor;

    block.children().adopt(self.firstChild, 0, 0);
    blockjQ.appendTo(self.firstChild.jQ);

    self.firstChild.cursor.appendTo(self.firstChild);
  };

  _.latex = function(){ return this.firstChild.latex(); };
  _.text = function(){ return this.firstChild.text(); };
});
/**********************************
 * Symbols and Special Characters
 *********************************/

LatexCmds.f = bind(Symbol, 'f', '<var class="florin">&fnof;</var><span style="display:inline-block;width:0">&nbsp;</span>');

var Variable = P(Symbol, function(_, _super) {
  _.init = function(ch, html) {
    _super.init.call(this, ch, '<var>'+(html || ch)+'</var>');
  }
  _.text = function() {
    var text = this.ctrlSeq;
    if (this.prev && !(this.prev instanceof Variable)
        && !(this.prev instanceof BinaryOperator))
      text = '*' + text;
    if (this.next && !(this.next instanceof BinaryOperator)
        && !(this.next.ctrlSeq === '^'))
      text += '*';
    return text;
  };
});

var VanillaSymbol = P(Symbol, function(_, _super) {
  _.init = function(ch, html) {
    _super.init.call(this, ch, '<span>'+(html || ch)+'</span>');
  };
});

CharCmds[' '] = bind(VanillaSymbol, '\\:', ' ');

LatexCmds.prime = CharCmds["'"] = bind(VanillaSymbol, "'", '&prime;');

// does not use Symbola font
var NonSymbolaSymbol = P(Symbol, function(_, _super) {
  _.init = function(ch, html) {
    _super.init.call(this, ch, '<span class="nonSymbola">'+(html || ch)+'</span>');
  };
});

LatexCmds['@'] = NonSymbolaSymbol;
LatexCmds['&'] = bind(NonSymbolaSymbol, '\\&', '&amp;');
LatexCmds['%'] = bind(NonSymbolaSymbol, '\\%', '%');

//the following are all Greek to me, but this helped a lot: http://www.ams.org/STIX/ion/stixsig03.html

//lowercase Greek letter variables
LatexCmds.alpha =
LatexCmds.beta =
LatexCmds.gamma =
LatexCmds.delta =
LatexCmds.zeta =
LatexCmds.eta =
LatexCmds.theta =
LatexCmds.iota =
LatexCmds.kappa =
LatexCmds.mu =
LatexCmds.nu =
LatexCmds.xi =
LatexCmds.rho =
LatexCmds.sigma =
LatexCmds.tau =
LatexCmds.chi =
LatexCmds.psi =
LatexCmds.omega = P(Variable, function(_, _super) {
  _.init = function(latex) {
    _super.init.call(this,'\\'+latex+' ','&'+latex+';');
  };
});

//why can't anybody FUCKING agree on these
LatexCmds.phi = //W3C or Unicode?
  bind(Variable,'\\phi ','&#981;');

LatexCmds.phiv = //Elsevier and 9573-13
LatexCmds.varphi = //AMS and LaTeX
  bind(Variable,'\\varphi ','&phi;');

LatexCmds.epsilon = //W3C or Unicode?
  bind(Variable,'\\epsilon ','&#1013;');

LatexCmds.epsiv = //Elsevier and 9573-13
LatexCmds.varepsilon = //AMS and LaTeX
  bind(Variable,'\\varepsilon ','&epsilon;');

LatexCmds.piv = //W3C/Unicode and Elsevier and 9573-13
LatexCmds.varpi = //AMS and LaTeX
  bind(Variable,'\\varpi ','&piv;');

LatexCmds.sigmaf = //W3C/Unicode
LatexCmds.sigmav = //Elsevier
LatexCmds.varsigma = //LaTeX
  bind(Variable,'\\varsigma ','&sigmaf;');

LatexCmds.thetav = //Elsevier and 9573-13
LatexCmds.vartheta = //AMS and LaTeX
LatexCmds.thetasym = //W3C/Unicode
  bind(Variable,'\\vartheta ','&thetasym;');

LatexCmds.upsilon = //AMS and LaTeX and W3C/Unicode
LatexCmds.upsi = //Elsevier and 9573-13
  bind(Variable,'\\upsilon ','&upsilon;');

//these aren't even mentioned in the HTML character entity references
LatexCmds.gammad = //Elsevier
LatexCmds.Gammad = //9573-13 -- WTF, right? I dunno if this was a typo in the reference (see above)
LatexCmds.digamma = //LaTeX
  bind(Variable,'\\digamma ','&#989;');

LatexCmds.kappav = //Elsevier
LatexCmds.varkappa = //AMS and LaTeX
  bind(Variable,'\\varkappa ','&#1008;');

LatexCmds.rhov = //Elsevier and 9573-13
LatexCmds.varrho = //AMS and LaTeX
  bind(Variable,'\\varrho ','&#1009;');

//Greek constants, look best in un-italicised Times New Roman
LatexCmds.pi = LatexCmds['π'] = bind(NonSymbolaSymbol,'\\pi ','&pi;');
LatexCmds.lambda = bind(NonSymbolaSymbol,'\\lambda ','&lambda;');

//uppercase greek letters

LatexCmds.Upsilon = //LaTeX
LatexCmds.Upsi = //Elsevier and 9573-13
LatexCmds.upsih = //W3C/Unicode "upsilon with hook"
LatexCmds.Upsih = //'cos it makes sense to me
  bind(Symbol,'\\Upsilon ','<var style="font-family: serif">&upsih;</var>'); //Symbola's 'upsilon with a hook' is a capital Y without hooks :(

//other symbols with the same LaTeX command and HTML character entity reference
LatexCmds.Gamma =
LatexCmds.Delta =
LatexCmds.Theta =
LatexCmds.Lambda =
LatexCmds.Xi =
LatexCmds.Pi =
LatexCmds.Sigma =
LatexCmds.Phi =
LatexCmds.Psi =
LatexCmds.Omega =
LatexCmds.forall = P(VanillaSymbol, function(_, _super) {
  _.init = function(latex) {
    _super.init.call(this,'\\'+latex+' ','&'+latex+';');
  };
});

// symbols that aren't a single MathCommand, but are instead a whole
// Fragment. Creates the Fragment from a LaTeX string
var LatexFragment = P(MathCommand, function(_) {
  _.init = function(latex) { this.latex = latex; };
  _.createBefore = function(cursor) { cursor.writeLatex(this.latex); };
  _.parser = function() {
    var frag = latexMathParser.parse(this.latex).children();
    return Parser.succeed(frag);
  };
});

// for what seems to me like [stupid reasons][1], Unicode provides
// subscripted and superscripted versions of all ten Arabic numerals,
// as well as [so-called "vulgar fractions"][2].
// Nobody really cares about most of them, but some of them actually
// predate Unicode, dating back to [ISO-8859-1][3], apparently also
// known as "Latin-1", which among other things [Windows-1252][4]
// largely coincides with, so Microsoft Word sometimes inserts them
// and they get copy-pasted into MathQuill.
//
// (Irrelevant but funny story: Windows-1252 is actually a strict
// superset of the "closely related but distinct"[3] "ISO 8859-1" --
// see the lack of a dash after "ISO"? Completely different character
// set, like elephants vs elephant seals, or "Zombies" vs "Zombie
// Redneck Torture Family". What kind of idiot would get them confused.
// People in fact got them confused so much, it was so common to
// mislabel Windows-1252 text as ISO-8859-1, that most modern web
// browsers and email clients treat the MIME charset of ISO-8859-1
// as actually Windows-1252, behavior now standard in the HTML5 spec.)
//
// [1]: http://en.wikipedia.org/wiki/Unicode_subscripts_and_superscripts
// [2]: http://en.wikipedia.org/wiki/Number_Forms
// [3]: http://en.wikipedia.org/wiki/ISO/IEC_8859-1
// [4]: http://en.wikipedia.org/wiki/Windows-1252
LatexCmds['¹'] = bind(LatexFragment, '^1');
LatexCmds['²'] = bind(LatexFragment, '^2');
LatexCmds['³'] = bind(LatexFragment, '^3');
LatexCmds['¼'] = bind(LatexFragment, '\\frac14');
LatexCmds['½'] = bind(LatexFragment, '\\frac12');
LatexCmds['¾'] = bind(LatexFragment, '\\frac34');

var BinaryOperator = P(Symbol, function(_, _super) {
  _.init = function(ctrlSeq, html, text) {
    _super.init.call(this,
      ctrlSeq, '<span class="binary-operator">'+html+'</span>', text
    );
  };
});

var PlusMinus = P(BinaryOperator, function(_) {
  _.init = VanillaSymbol.prototype.init;

  _.respace = function() {
    if (!this.prev) {
      this.jQ[0].className = '';
    }
    else if (
      this.prev instanceof BinaryOperator &&
      this.next && !(this.next instanceof BinaryOperator)
    ) {
      this.jQ[0].className = 'unary-operator';
    }
    else {
      this.jQ[0].className = 'binary-operator';
    }
    return this;
  };
});

LatexCmds['+'] = bind(PlusMinus, '+', '+');
//yes, these are different dashes, I think one is an en dash and the other is a hyphen
LatexCmds['–'] = LatexCmds['-'] = bind(PlusMinus, '-', '&minus;');
LatexCmds['±'] = LatexCmds.pm = LatexCmds.plusmn = LatexCmds.plusminus =
  bind(PlusMinus,'\\pm ','&plusmn;');
LatexCmds.mp = LatexCmds.mnplus = LatexCmds.minusplus =
  bind(PlusMinus,'\\mp ','&#8723;');

CharCmds['*'] = LatexCmds.sdot = LatexCmds.cdot =
  bind(BinaryOperator, '\\cdot ', '&middot;');
//semantically should be &sdot;, but &middot; looks better

LatexCmds['='] = bind(BinaryOperator, '=', '=');
LatexCmds['<'] = bind(BinaryOperator, '<', '&lt;');
LatexCmds['>'] = bind(BinaryOperator, '>', '&gt;');

LatexCmds.notin =
LatexCmds.sim =
LatexCmds.cong =
LatexCmds.equiv =
LatexCmds.oplus =
LatexCmds.otimes = P(BinaryOperator, function(_, _super) {
  _.init = function(latex) {
    _super.init.call(this, '\\'+latex+' ', '&'+latex+';');
  };
});

LatexCmds.times = bind(BinaryOperator, '\\times ', '&times;', '[x]');

LatexCmds['÷'] = LatexCmds.div = LatexCmds.divide = LatexCmds.divides =
  bind(BinaryOperator,'\\div ','&divide;', '[/]');

LatexCmds['≠'] = LatexCmds.ne = LatexCmds.neq = bind(BinaryOperator,'\\ne ','&ne;');

LatexCmds.ast = LatexCmds.star = LatexCmds.loast = LatexCmds.lowast =
  bind(BinaryOperator,'\\ast ','&lowast;');
  //case 'there4 = // a special exception for this one, perhaps?
LatexCmds.therefor = LatexCmds.therefore =
  bind(BinaryOperator,'\\therefore ','&there4;');

LatexCmds.cuz = // l33t
LatexCmds.because = bind(BinaryOperator,'\\because ','&#8757;');

LatexCmds.prop = LatexCmds.propto = bind(BinaryOperator,'\\propto ','&prop;');

LatexCmds['≈'] = LatexCmds.asymp = LatexCmds.approx = bind(BinaryOperator,'\\approx ','&asymp;');
LatexCmds.napprox = bind(BinaryOperator,'\\not\\approx ','&#8777;');

LatexCmds.lt = bind(BinaryOperator,'<','&lt;');

LatexCmds.gt = bind(BinaryOperator,'>','&gt;');

LatexCmds['≤'] = LatexCmds.le = LatexCmds.leq = bind(BinaryOperator,'\\le ','&le;');

LatexCmds['≥'] = LatexCmds.ge = LatexCmds.geq = bind(BinaryOperator,'\\ge ','&ge;');

LatexCmds.isin = LatexCmds['in'] = bind(BinaryOperator,'\\in ','&isin;');

LatexCmds.ni = LatexCmds.contains = bind(BinaryOperator,'\\ni ','&ni;');

LatexCmds.notni = LatexCmds.niton = LatexCmds.notcontains = LatexCmds.doesnotcontain =
  bind(BinaryOperator,'\\not\\ni ','&#8716;');

LatexCmds.sub = LatexCmds.subset = bind(BinaryOperator,'\\subset ','&sub;');

LatexCmds.sup = LatexCmds.supset = LatexCmds.superset =
  bind(BinaryOperator,'\\supset ','&sup;');

LatexCmds.nsub = LatexCmds.notsub =
LatexCmds.nsubset = LatexCmds.notsubset =
  bind(BinaryOperator,'\\not\\subset ','&#8836;');

LatexCmds.nsup = LatexCmds.notsup =
LatexCmds.nsupset = LatexCmds.notsupset =
LatexCmds.nsuperset = LatexCmds.notsuperset =
  bind(BinaryOperator,'\\not\\supset ','&#8837;');

LatexCmds.sube = LatexCmds.subeq = LatexCmds.subsete = LatexCmds.subseteq =
  bind(BinaryOperator,'\\subseteq ','&sube;');

LatexCmds.supe = LatexCmds.supeq =
LatexCmds.supsete = LatexCmds.supseteq =
LatexCmds.supersete = LatexCmds.superseteq =
  bind(BinaryOperator,'\\supseteq ','&supe;');

LatexCmds.nsube = LatexCmds.nsubeq =
LatexCmds.notsube = LatexCmds.notsubeq =
LatexCmds.nsubsete = LatexCmds.nsubseteq =
LatexCmds.notsubsete = LatexCmds.notsubseteq =
  bind(BinaryOperator,'\\not\\subseteq ','&#8840;');

LatexCmds.nsupe = LatexCmds.nsupeq =
LatexCmds.notsupe = LatexCmds.notsupeq =
LatexCmds.nsupsete = LatexCmds.nsupseteq =
LatexCmds.notsupsete = LatexCmds.notsupseteq =
LatexCmds.nsupersete = LatexCmds.nsuperseteq =
LatexCmds.notsupersete = LatexCmds.notsuperseteq =
  bind(BinaryOperator,'\\not\\supseteq ','&#8841;');


//sum, product, coproduct, integral
var BigSymbol = P(Symbol, function(_, _super) {
  _.init = function(ch, html) {
    _super.init.call(this, ch, '<big>'+html+'</big>');
  };
});

LatexCmds['∑'] = LatexCmds.sum = LatexCmds.summation = bind(BigSymbol,'\\sum ','&sum;');
LatexCmds['∏'] = LatexCmds.prod = LatexCmds.product = bind(BigSymbol,'\\prod ','&prod;');
LatexCmds.coprod = LatexCmds.coproduct = bind(BigSymbol,'\\coprod ','&#8720;');
LatexCmds['∫'] = LatexCmds['int'] = LatexCmds.integral = bind(BigSymbol,'\\int ','&int;');



//the canonical sets of numbers
// LatexCmds.N =
LatexCmds.naturals = LatexCmds.Naturals =
  bind(VanillaSymbol,'\\mathbb{N}','&#8469;');

// LatexCmds.P =
LatexCmds.primes = LatexCmds.Primes =
LatexCmds.projective = LatexCmds.Projective =
LatexCmds.probability = LatexCmds.Probability =
  bind(VanillaSymbol,'\\mathbb{P}','&#8473;');

// LatexCmds.Z =
LatexCmds.integers = LatexCmds.Integers =
  bind(VanillaSymbol,'\\mathbb{Z}','&#8484;');

// LatexCmds.Q =
LatexCmds.rationals = LatexCmds.Rationals =
  bind(VanillaSymbol,'\\mathbb{Q}','&#8474;');

// LatexCmds.R =
LatexCmds.reals = LatexCmds.Reals =
  bind(VanillaSymbol,'\\mathbb{R}','&#8477;');

// LatexCmds.C =
LatexCmds.complex = LatexCmds.Complex =
LatexCmds.complexes = LatexCmds.Complexes =
LatexCmds.complexplane = LatexCmds.Complexplane = LatexCmds.ComplexPlane =
  bind(VanillaSymbol,'\\mathbb{C}','&#8450;');

// LatexCmds.H =
LatexCmds.Hamiltonian = LatexCmds.quaternions = LatexCmds.Quaternions =
  bind(VanillaSymbol,'\\mathbb{H}','&#8461;');

//spacing
LatexCmds.quad = LatexCmds.emsp = bind(VanillaSymbol,'\\quad ','    ');
LatexCmds.qquad = bind(VanillaSymbol,'\\qquad ','        ');
/* spacing special characters, gonna have to implement this in LatexCommandInput::onText somehow
case ',':
  return VanillaSymbol('\\, ',' ');
case ':':
  return VanillaSymbol('\\: ','  ');
case ';':
  return VanillaSymbol('\\; ','   ');
case '!':
  return Symbol('\\! ','<span style="margin-right:-.2em"></span>');
*/

//binary operators
LatexCmds.diamond = bind(VanillaSymbol, '\\diamond ', '&#9671;');
LatexCmds.bigtriangleup = bind(VanillaSymbol, '\\bigtriangleup ', '&#9651;');
LatexCmds.ominus = bind(VanillaSymbol, '\\ominus ', '&#8854;');
LatexCmds.uplus = bind(VanillaSymbol, '\\uplus ', '&#8846;');
LatexCmds.bigtriangledown = bind(VanillaSymbol, '\\bigtriangledown ', '&#9661;');
LatexCmds.sqcap = bind(VanillaSymbol, '\\sqcap ', '&#8851;');
LatexCmds.lhd = bind(VanillaSymbol, '\\lhd ', '&#8882;');
LatexCmds.triangleleft = bind(VanillaSymbol, '\\triangleleft ', '&#8882;');
LatexCmds.sqcup = bind(VanillaSymbol, '\\sqcup ', '&#8852;');
LatexCmds.rhd = bind(VanillaSymbol, '\\rhd ', '&#8883;');
LatexCmds.triangleright = bind(VanillaSymbol, '\\triangleright ', '&#8883;');
LatexCmds.odot = bind(VanillaSymbol, '\\odot ', '&#8857;');
LatexCmds.bigcirc = bind(VanillaSymbol, '\\bigcirc ', '&#9711;');
LatexCmds.dagger = bind(VanillaSymbol, '\\dagger ', '&#0134;');
LatexCmds.ddagger = bind(VanillaSymbol, '\\ddagger ', '&#135;');
LatexCmds.wr = bind(VanillaSymbol, '\\wr ', '&#8768;');
LatexCmds.amalg = bind(VanillaSymbol, '\\amalg ', '&#8720;');

//relationship symbols
LatexCmds.models = bind(VanillaSymbol, '\\models ', '&#8872;');
LatexCmds.prec = bind(VanillaSymbol, '\\prec ', '&#8826;');
LatexCmds.succ = bind(VanillaSymbol, '\\succ ', '&#8827;');
LatexCmds.preceq = bind(VanillaSymbol, '\\preceq ', '&#8828;');
LatexCmds.succeq = bind(VanillaSymbol, '\\succeq ', '&#8829;');
LatexCmds.simeq = bind(VanillaSymbol, '\\simeq ', '&#8771;');
LatexCmds.mid = bind(VanillaSymbol, '\\mid ', '&#8739;');
LatexCmds.ll = bind(VanillaSymbol, '\\ll ', '&#8810;');
LatexCmds.gg = bind(VanillaSymbol, '\\gg ', '&#8811;');
LatexCmds.parallel = bind(VanillaSymbol, '\\parallel ', '&#8741;');
LatexCmds.nparallel = bind(VanillaSymbol, '\\nparallel ', '&#8742;');
LatexCmds.bowtie = bind(VanillaSymbol, '\\bowtie ', '&#8904;');
LatexCmds.sqsubset = bind(VanillaSymbol, '\\sqsubset ', '&#8847;');
LatexCmds.sqsupset = bind(VanillaSymbol, '\\sqsupset ', '&#8848;');
LatexCmds.smile = bind(VanillaSymbol, '\\smile ', '&#8995;');
LatexCmds.sqsubseteq = bind(VanillaSymbol, '\\sqsubseteq ', '&#8849;');
LatexCmds.sqsupseteq = bind(VanillaSymbol, '\\sqsupseteq ', '&#8850;');
LatexCmds.doteq = bind(VanillaSymbol, '\\doteq ', '&#8784;');
LatexCmds.frown = bind(VanillaSymbol, '\\frown ', '&#8994;');
LatexCmds.vdash = bind(VanillaSymbol, '\\vdash ', '&#8870;');
LatexCmds.dashv = bind(VanillaSymbol, '\\dashv ', '&#8867;');

//arrows
LatexCmds.longleftarrow = bind(VanillaSymbol, '\\longleftarrow ', '&#8592;');
LatexCmds.longrightarrow = bind(VanillaSymbol, '\\longrightarrow ', '&#8594;');
LatexCmds.Longleftarrow = bind(VanillaSymbol, '\\Longleftarrow ', '&#8656;');
LatexCmds.Longrightarrow = bind(VanillaSymbol, '\\Longrightarrow ', '&#8658;');
LatexCmds.longleftrightarrow = bind(VanillaSymbol, '\\longleftrightarrow ', '&#8596;');
LatexCmds.updownarrow = bind(VanillaSymbol, '\\updownarrow ', '&#8597;');
LatexCmds.Longleftrightarrow = bind(VanillaSymbol, '\\Longleftrightarrow ', '&#8660;');
LatexCmds.Updownarrow = bind(VanillaSymbol, '\\Updownarrow ', '&#8661;');
LatexCmds.mapsto = bind(VanillaSymbol, '\\mapsto ', '&#8614;');
LatexCmds.nearrow = bind(VanillaSymbol, '\\nearrow ', '&#8599;');
LatexCmds.hookleftarrow = bind(VanillaSymbol, '\\hookleftarrow ', '&#8617;');
LatexCmds.hookrightarrow = bind(VanillaSymbol, '\\hookrightarrow ', '&#8618;');
LatexCmds.searrow = bind(VanillaSymbol, '\\searrow ', '&#8600;');
LatexCmds.leftharpoonup = bind(VanillaSymbol, '\\leftharpoonup ', '&#8636;');
LatexCmds.rightharpoonup = bind(VanillaSymbol, '\\rightharpoonup ', '&#8640;');
LatexCmds.swarrow = bind(VanillaSymbol, '\\swarrow ', '&#8601;');
LatexCmds.leftharpoondown = bind(VanillaSymbol, '\\leftharpoondown ', '&#8637;');
LatexCmds.rightharpoondown = bind(VanillaSymbol, '\\rightharpoondown ', '&#8641;');
LatexCmds.nwarrow = bind(VanillaSymbol, '\\nwarrow ', '&#8598;');
LatexCmds.rightleftarrows = bind(VanillaSymbol, '\\rightleftarrows ', '&#8644;');

//Misc
LatexCmds.ldots = bind(VanillaSymbol, '\\ldots ', '&#8230;');
LatexCmds.cdots = bind(VanillaSymbol, '\\cdots ', '&#8943;');
LatexCmds.vdots = bind(VanillaSymbol, '\\vdots ', '&#8942;');
LatexCmds.ddots = bind(VanillaSymbol, '\\ddots ', '&#8944;');
LatexCmds.surd = bind(VanillaSymbol, '\\surd ', '&#8730;');
LatexCmds.triangle = bind(VanillaSymbol, '\\triangle ', '&#9653;');
LatexCmds.ell = bind(VanillaSymbol, '\\ell ', '&#8467;');
LatexCmds.top = bind(VanillaSymbol, '\\top ', '&#8868;');
LatexCmds.flat = bind(VanillaSymbol, '\\flat ', '&#9837;');
LatexCmds.natural = bind(VanillaSymbol, '\\natural ', '&#9838;');
LatexCmds.sharp = bind(VanillaSymbol, '\\sharp ', '&#9839;');
LatexCmds.wp = bind(VanillaSymbol, '\\wp ', '&#8472;');
LatexCmds.bot = bind(VanillaSymbol, '\\bot ', '&#8869;');
LatexCmds.clubsuit = bind(VanillaSymbol, '\\clubsuit ', '&#9827;');
LatexCmds.diamondsuit = bind(VanillaSymbol, '\\diamondsuit ', '&#9826;');
LatexCmds.heartsuit = bind(VanillaSymbol, '\\heartsuit ', '&#9825;');
LatexCmds.spadesuit = bind(VanillaSymbol, '\\spadesuit ', '&#9824;');

//variable-sized
LatexCmds.oint = bind(VanillaSymbol, '\\oint ', '&#8750;');
LatexCmds.bigcap = bind(VanillaSymbol, '\\bigcap ', '&#8745;');
LatexCmds.bigcup = bind(VanillaSymbol, '\\bigcup ', '&#8746;');
LatexCmds.bigsqcup = bind(VanillaSymbol, '\\bigsqcup ', '&#8852;');
LatexCmds.bigvee = bind(VanillaSymbol, '\\bigvee ', '&#8744;');
LatexCmds.bigwedge = bind(VanillaSymbol, '\\bigwedge ', '&#8743;');
LatexCmds.bigodot = bind(VanillaSymbol, '\\bigodot ', '&#8857;');
LatexCmds.bigotimes = bind(VanillaSymbol, '\\bigotimes ', '&#8855;');
LatexCmds.bigoplus = bind(VanillaSymbol, '\\bigoplus ', '&#8853;');
LatexCmds.biguplus = bind(VanillaSymbol, '\\biguplus ', '&#8846;');

//delimiters
LatexCmds.lfloor = bind(VanillaSymbol, '\\lfloor ', '&#8970;');
LatexCmds.rfloor = bind(VanillaSymbol, '\\rfloor ', '&#8971;');
LatexCmds.lceil = bind(VanillaSymbol, '\\lceil ', '&#8968;');
LatexCmds.rceil = bind(VanillaSymbol, '\\rceil ', '&#8969;');
LatexCmds.slash = bind(VanillaSymbol, '\\slash ', '&#47;');
LatexCmds.opencurlybrace = bind(VanillaSymbol, '\\opencurlybrace ', '&#123;');
LatexCmds.closecurlybrace = bind(VanillaSymbol, '\\closecurlybrace ', '&#125;');

//various symbols

LatexCmds.caret = bind(VanillaSymbol,'\\caret ','^');
LatexCmds.underscore = bind(VanillaSymbol,'\\underscore ','_');
LatexCmds.backslash = bind(VanillaSymbol,'\\backslash ','\\');
LatexCmds.vert = bind(VanillaSymbol,'|');
LatexCmds.perp = LatexCmds.perpendicular = bind(VanillaSymbol,'\\perp ','&perp;');
LatexCmds.nabla = LatexCmds.del = bind(VanillaSymbol,'\\nabla ','&nabla;');
LatexCmds.hbar = bind(VanillaSymbol,'\\hbar ','&#8463;');

LatexCmds.AA = LatexCmds.Angstrom = LatexCmds.angstrom =
  bind(VanillaSymbol,'\\text\\AA ','&#8491;');

LatexCmds.ring = LatexCmds.circ = LatexCmds.circle =
  bind(VanillaSymbol,'\\circ ','&#8728;');

LatexCmds.bull = LatexCmds.bullet = bind(VanillaSymbol,'\\bullet ','&bull;');

LatexCmds.setminus = LatexCmds.smallsetminus =
  bind(VanillaSymbol,'\\setminus ','&#8726;');

LatexCmds.not = //bind(Symbol,'\\not ','<span class="not">/</span>');
LatexCmds['¬'] = LatexCmds.neg = bind(VanillaSymbol,'\\neg ','&not;');

LatexCmds['…'] = LatexCmds.dots = LatexCmds.ellip = LatexCmds.hellip =
LatexCmds.ellipsis = LatexCmds.hellipsis =
  bind(VanillaSymbol,'\\dots ','&hellip;');

LatexCmds.converges =
LatexCmds.darr = LatexCmds.dnarr = LatexCmds.dnarrow = LatexCmds.downarrow =
  bind(VanillaSymbol,'\\downarrow ','&darr;');

LatexCmds.dArr = LatexCmds.dnArr = LatexCmds.dnArrow = LatexCmds.Downarrow =
  bind(VanillaSymbol,'\\Downarrow ','&dArr;');

LatexCmds.diverges = LatexCmds.uarr = LatexCmds.uparrow =
  bind(VanillaSymbol,'\\uparrow ','&uarr;');

LatexCmds.uArr = LatexCmds.Uparrow = bind(VanillaSymbol,'\\Uparrow ','&uArr;');

LatexCmds.to = bind(BinaryOperator,'\\to ','&rarr;');

LatexCmds.rarr = LatexCmds.rightarrow = bind(VanillaSymbol,'\\rightarrow ','&rarr;');

LatexCmds.implies = bind(BinaryOperator,'\\Rightarrow ','&rArr;');

LatexCmds.rArr = LatexCmds.Rightarrow = bind(VanillaSymbol,'\\Rightarrow ','&rArr;');

LatexCmds.gets = bind(BinaryOperator,'\\gets ','&larr;');

LatexCmds.larr = LatexCmds.leftarrow = bind(VanillaSymbol,'\\leftarrow ','&larr;');

LatexCmds.impliedby = bind(BinaryOperator,'\\Leftarrow ','&lArr;');

LatexCmds.lArr = LatexCmds.Leftarrow = bind(VanillaSymbol,'\\Leftarrow ','&lArr;');

LatexCmds.harr = LatexCmds.lrarr = LatexCmds.leftrightarrow =
  bind(VanillaSymbol,'\\leftrightarrow ','&harr;');

LatexCmds.iff = bind(BinaryOperator,'\\Leftrightarrow ','&hArr;');

LatexCmds.hArr = LatexCmds.lrArr = LatexCmds.Leftrightarrow =
  bind(VanillaSymbol,'\\Leftrightarrow ','&hArr;');

LatexCmds.Re = LatexCmds.Real = LatexCmds.real = bind(VanillaSymbol,'\\Re ','&real;');

LatexCmds.Im = LatexCmds.imag =
LatexCmds.image = LatexCmds.imagin = LatexCmds.imaginary = LatexCmds.Imaginary =
  bind(VanillaSymbol,'\\Im ','&image;');

LatexCmds.part = LatexCmds.partial = bind(VanillaSymbol,'\\partial ','&part;');

LatexCmds.inf = LatexCmds.infin = LatexCmds.infty = LatexCmds.infinity =
  bind(VanillaSymbol,'\\infty ','&infin;');

LatexCmds.alef = LatexCmds.alefsym = LatexCmds.aleph = LatexCmds.alephsym =
  bind(VanillaSymbol,'\\aleph ','&alefsym;');

LatexCmds.xist = //LOL
LatexCmds.xists = LatexCmds.exist = LatexCmds.exists =
  bind(VanillaSymbol,'\\exists ','&exist;');
LatexCmds.nexists = bind(VanillaSymbol,'\\nexists','&#8708;');

LatexCmds.and = LatexCmds.land = LatexCmds.wedge =
  bind(VanillaSymbol,'\\wedge ','&and;');

LatexCmds.or = LatexCmds.lor = LatexCmds.vee = bind(VanillaSymbol,'\\vee ','&or;');

// LatexCmds.o =
// LatexCmds.O =
LatexCmds.empty = LatexCmds.emptyset =
LatexCmds.oslash = LatexCmds.Oslash =
LatexCmds.nothing = LatexCmds.varnothing =
  bind(BinaryOperator,'\\varnothing ','&empty;');

LatexCmds.cup = LatexCmds.union = bind(BinaryOperator,'\\cup ','&cup;');

LatexCmds.cap = LatexCmds.intersect = LatexCmds.intersection =
  bind(BinaryOperator,'\\cap ','&cap;');

LatexCmds.deg = LatexCmds.degree = bind(VanillaSymbol,'^\\circ ','&deg;');

LatexCmds.ang = LatexCmds.angle = bind(VanillaSymbol,'\\angle ','&ang;');
LatexCmds.mang = LatexCmds.measuredangle = bind(VanillaSymbol,'\\measuredangle ','&#8737;');

var NonItalicizedFunction = P(Symbol, function(_, _super) {
  _.init = function(fn) {
    _super.init.call(this, '\\'+fn+' ', '<span>'+fn+'</span>');
  };
  _.respace = function()
  {
    this.jQ[0].className =
      (this.next instanceof SupSub || this.next instanceof Bracket) ?
      '' : 'non-italicized-function';
  };
});

LatexCmds.ln =
LatexCmds.lg =
LatexCmds.log =
LatexCmds.span =
LatexCmds.proj =
LatexCmds.det =
LatexCmds.dim =
LatexCmds.min =
LatexCmds.max =
LatexCmds.mod =
LatexCmds.lcm =
LatexCmds.gcd =
LatexCmds.gcf =
LatexCmds.hcf =
LatexCmds.lim = NonItalicizedFunction;

(function() {
  var trig = ['sin', 'cos', 'tan', 'sec', 'cosec', 'csc', 'cotan', 'cot'];
  for (var i in trig) {
    LatexCmds[trig[i]] =
    LatexCmds[trig[i]+'h'] =
    LatexCmds['a'+trig[i]] = LatexCmds['arc'+trig[i]] =
    LatexCmds['a'+trig[i]+'h'] = LatexCmds['arc'+trig[i]+'h'] =
      NonItalicizedFunction;
  }
}());

// Parser MathCommand
var latexMathParser = (function() {
  function commandToBlock(cmd) {
    var block = MathBlock();
    cmd.adopt(block, 0, 0);
    return block;
  }
  function joinBlocks(blocks) {
    var firstBlock = blocks[0] || MathBlock();

    for (var i = 1; i < blocks.length; i += 1) {
      blocks[i].children().adopt(firstBlock, firstBlock.lastChild, 0);
    }

    return firstBlock;
  }

  var string = Parser.string;
  var regex = Parser.regex;
  var letter = Parser.letter;
  var any = Parser.any;
  var optWhitespace = Parser.optWhitespace;
  var succeed = Parser.succeed;
  var fail = Parser.fail;

  // Parsers yielding MathCommands
  var variable = letter.map(Variable);
  var symbol = regex(/^[^${}\\_^]/).map(VanillaSymbol);

  var controlSequence =
    regex(/^[^\\]/)
    .or(string('\\').then(
      regex(/^[a-z]+/i)
      .or(regex(/^\s+/).result(' '))
      .or(any)
    )).then(function(ctrlSeq) {
      var cmdKlass = LatexCmds[ctrlSeq];

      if (cmdKlass) {
        return cmdKlass(ctrlSeq).parser();
      }
      else {
        return fail('unknown command: \\'+ctrlSeq);
      }
    })
  ;

  var command =
    controlSequence
    .or(variable)
    .or(symbol)
  ;

  // Parsers yielding MathBlocks
  var mathGroup = string('{').then(function() { return mathSequence; }).skip(string('}'));
  var mathBlock = optWhitespace.then(mathGroup.or(command.map(commandToBlock)));
  var mathSequence = mathBlock.many().map(joinBlocks).skip(optWhitespace);

  var optMathBlock =
    string('[').then(
      mathBlock.then(function(block) {
        return block.join('latex') !== ']' ? succeed(block) : fail();
      })
      .many().map(joinBlocks).skip(optWhitespace)
    ).skip(string(']'))
  ;

  var latexMath = mathSequence;

  latexMath.block = mathBlock;
  latexMath.optBlock = optMathBlock;
  return latexMath;
})();
/********************************************
 * Cursor and Selection "singleton" classes
 *******************************************/

/* The main thing that manipulates the Math DOM. Makes sure to manipulate the
HTML DOM to match. */

/* Sort of singletons, since there should only be one per editable math
textbox, but any one HTML document can contain many such textboxes, so any one
JS environment could actually contain many instances. */

//A fake cursor in the fake textbox that the math is rendered in.
var Cursor = P(function(_) {
  _.init = function(root) {
    this.parent = this.root = root;
    var jQ = this.jQ = this._jQ = $('<span class="cursor">&zwj;</span>');

    //closured for setInterval
    this.blink = function(){ jQ.toggleClass('blink'); }

    this.upDownCache = {};
  };

  _.prev = 0;
  _.next = 0;
  _.parent = 0;
  _.show = function() {
    this.jQ = this._jQ.removeClass('blink');
    if ('intervalId' in this) //already was shown, just restart interval
      clearInterval(this.intervalId);
    else { //was hidden and detached, insert this.jQ back into HTML DOM
      if (this.next) {
        if (this.selection && this.selection.first.prev === this.prev)
          this.jQ.insertBefore(this.selection.jQ);
        else
          this.jQ.insertBefore(this.next.jQ.first());
      }
      else
        this.jQ.appendTo(this.parent.jQ);
      this.parent.focus();
    }
    this.intervalId = setInterval(this.blink, 500);
    return this;
  };
  _.hide = function() {
    if ('intervalId' in this)
      clearInterval(this.intervalId);
    delete this.intervalId;
    this.jQ.detach();
    this.jQ = $();
    return this;
  };
  _.insertAt = function(parent, prev, next) {
    var old_parent = this.parent;

    this.parent = parent;
    this.prev = prev;
    this.next = next;

    old_parent.blur(); //blur may need to know cursor's destination
  };
  _.insertBefore = function(el) {
    this.insertAt(el.parent, el.prev, el)
    this.parent.jQ.addClass('hasCursor');
    this.jQ.insertBefore(el.jQ.first());
    return this;
  };
  _.insertAfter = function(el) {
    this.insertAt(el.parent, el, el.next);
    this.parent.jQ.addClass('hasCursor');
    this.jQ.insertAfter(el.jQ.last());
    return this;
  };
  _.prependTo = function(el) {
    this.insertAt(el, 0, el.firstChild);
    if (el.textarea) //never insert before textarea
      this.jQ.insertAfter(el.textarea);
    else
      this.jQ.prependTo(el.jQ);
    el.focus();
    return this;
  };
  _.appendTo = function(el) {
    this.insertAt(el, el.lastChild, 0);
    this.jQ.appendTo(el.jQ);
    el.focus();
    return this;
  };
  _.hopLeft = function() {
    this.jQ.insertBefore(this.prev.jQ.first());
    this.next = this.prev;
    this.prev = this.prev.prev;
    return this;
  };
  _.hopRight = function() {
    this.jQ.insertAfter(this.next.jQ.last());
    this.prev = this.next;
    this.next = this.next.next;
    return this;
  };
  _.moveLeftWithin = function(block) {
    if (this.prev) {
      if (this.prev.lastChild) this.appendTo(this.prev.lastChild)
      else this.hopLeft();
    }
    else {
      // we're at the beginning of the containing block, so do nothing.
      if (this.parent === block) return;

      if (this.parent.prev) this.appendTo(this.parent.prev);
      else this.insertBefore(this.parent.parent);
    }
  };
  _.moveRightWithin = function(block) {
    if (this.next) {
      if (this.next.firstChild) this.prependTo(this.next.firstChild)
      else this.hopRight();
    }
    else {
      // we're at the end of the containing block, so do nothing.
      if (this.parent === block) return;

      if (this.parent.next) this.prependTo(this.parent.next);
      else this.insertAfter(this.parent.parent);
    }
  };
  _.moveLeft = function() {
    clearUpDownCache(this);

    if (this.selection)
      this.insertBefore(this.selection.first).clearSelection();
    else {
      this.moveLeftWithin(this.root);
    }
    return this.show();
  };
  _.moveRight = function() {
    clearUpDownCache(this);

    if (this.selection)
      this.insertAfter(this.selection.last).clearSelection();
    else {
      this.moveRightWithin(this.root);
    }
    return this.show();
  };

  /**
   * moveUp and moveDown have almost identical algorithms:
   * - first check next and prev, if so prepend/appendTo them
   * - else check the parent's 'up'/'down' property - if it's a function,
   *   call it with the cursor as the sole argument and use the return value.
   *
   *   Given undefined, will bubble up to the next ancestor block.
   *   Given false, will stop bubbling.
   *   Given a MathBlock,
   *     + moveUp will appendTo it
   *     + moveDown will prependTo it
   *
   */
  _.moveUp = function() { return moveUpDown(this, 'up'); };
  _.moveDown = function() { return moveUpDown(this, 'down'); };
  function moveUpDown(self, dir) {
    if (self.next[dir]) self.prependTo(self.next[dir]);
    else if (self.prev[dir]) self.appendTo(self.prev[dir]);
    else {
      var ancestorBlock = self.parent;
      do {
        var prop = ancestorBlock[dir];
        if (prop) {
          if (typeof prop === 'function') prop = ancestorBlock[dir](self);
          if (prop === false || prop instanceof MathBlock) {
            self.upDownCache[ancestorBlock.id] = { parent: self.parent, prev: self.prev, next: self.next };

            if (prop instanceof MathBlock) {
              var cached = self.upDownCache[prop.id];

              if (cached) {
                if (cached.next) {
                  self.insertBefore(cached.next);
                } else {
                  self.appendTo(cached.parent);
                }
              } else {
                var pageX = offset(self).left;
                self.appendTo(prop);
                self.seekHoriz(pageX, prop);
              }
            }
            break;
          }
        }
        ancestorBlock = ancestorBlock.parent.parent;
      } while (ancestorBlock);
    }

    return self.clearSelection().show();
  }

  _.seek = function(target, pageX, pageY) {
    clearUpDownCache(this);
    var cmd, block, cursor = this.clearSelection().show();
    if (target.hasClass('empty')) {
      cursor.prependTo(MathElement[target.attr(mqBlockId)]);
      return cursor;
    }

    cmd = MathElement[target.attr(mqCmdId)];
    if (cmd instanceof Symbol) { //insert at whichever side is closer
      if (target.outerWidth() > 2*(pageX - target.offset().left))
        cursor.insertBefore(cmd);
      else
        cursor.insertAfter(cmd);

      return cursor;
    }
    if (!cmd) {
      block = MathElement[target.attr(mqBlockId)];
      if (!block) { //if no MathQuill data, try parent, if still no, just start from the root
        target = target.parent();
        cmd = MathElement[target.attr(mqCmdId)];
        if (!cmd) {
          block = MathElement[target.attr(mqBlockId)];
          if (!block) block = cursor.root;
        }
      }
    }

    if (cmd)
      cursor.insertAfter(cmd);
    else
      cursor.appendTo(block);

    return cursor.seekHoriz(pageX, cursor.root);
  };
  _.seekHoriz = function(pageX, block) {
    //move cursor to position closest to click
    var cursor = this;
    var dist = offset(cursor).left - pageX;
    var prevDist;

    do {
      cursor.moveLeftWithin(block);
      prevDist = dist;
      dist = offset(cursor).left - pageX;
    }
    while (dist > 0 && (cursor.prev || cursor.parent !== block));

    if (-dist > prevDist) cursor.moveRightWithin(block);

    return cursor;
  };
  function offset(self) {
    //in Opera 11.62, .getBoundingClientRect() and hence jQuery::offset()
    //returns all 0's on inline elements with negative margin-right (like
    //the cursor) at the end of their parent, so temporarily remove the
    //negative margin-right when calling jQuery::offset()
    //Opera bug DSK-360043
    //http://bugs.jquery.com/ticket/11523
    //https://github.com/jquery/jquery/pull/717
    var offset = self.jQ.removeClass('cursor').offset();
    self.jQ.addClass('cursor');
    return offset;
  }
  _.writeLatex = function(latex) {
    var self = this;
    clearUpDownCache(self);
    self.show().deleteSelection();

    var all = Parser.all;
    var eof = Parser.eof;

    var block = latexMathParser.skip(eof).or(all.result(false)).parse(latex);

    if (block) {
      block.children().adopt(self.parent, self.prev, self.next);
      MathElement.jQize(block.join('html')).insertBefore(self.jQ);
      self.prev = block.lastChild;
      block.finalizeInsert();
      self.parent.bubble('redraw');
    }

    return this.hide();
  };
  _.write = function(ch) {
    clearUpDownCache(this);
    return this.show().insertCh(ch);
  };
  _.insertCh = function(ch) {
    var cmd;
    if (ch.match(/^[a-eg-zA-Z]$/)) //exclude f because want florin
      cmd = Variable(ch);
    else if (cmd = CharCmds[ch] || LatexCmds[ch])
      cmd = cmd(ch);
    else
      cmd = VanillaSymbol(ch);

    if (this.selection) {
      this.prev = this.selection.first.prev;
      this.next = this.selection.last.next;
      cmd.replaces(this.selection);
      delete this.selection;
    }

    return this.insertNew(cmd);
  };
  _.insertNew = function(cmd) {
    cmd.createBefore(this);
    return this;
  };
  _.insertCmd = function(latexCmd, replacedFragment) {
    var cmd = LatexCmds[latexCmd];
    if (cmd) {
      cmd = cmd(latexCmd);
      if (replacedFragment) cmd.replaces(replacedFragment);
      this.insertNew(cmd);
    }
    else {
      cmd = TextBlock();
      cmd.replaces(latexCmd);
      cmd.firstChild.focus = function(){ delete this.focus; return this; };
      this.insertNew(cmd).insertAfter(cmd);
      if (replacedFragment)
        replacedFragment.remove();
    }
    return this;
  };
  _.unwrapGramp = function() {
    var gramp = this.parent.parent;
    var greatgramp = gramp.parent;
    var next = gramp.next;
    var cursor = this;

    var prev = gramp.prev;
    gramp.disown().eachChild(function(uncle) {
      if (uncle.isEmpty()) return;

      uncle.children()
        .adopt(greatgramp, prev, next)
        .each(function(cousin) {
          cousin.jQ.insertBefore(gramp.jQ.first());
        })
      ;

      prev = uncle.lastChild;
    });

    if (!this.next) { //then find something to be next to insertBefore
      if (this.prev)
        this.next = this.prev.next;
      else {
        while (!this.next) {
          this.parent = this.parent.next;
          if (this.parent)
            this.next = this.parent.firstChild;
          else {
            this.next = gramp.next;
            this.parent = greatgramp;
            break;
          }
        }
      }
    }
    if (this.next)
      this.insertBefore(this.next);
    else
      this.appendTo(greatgramp);

    gramp.jQ.remove();

    if (gramp.prev)
      gramp.prev.respace();
    if (gramp.next)
      gramp.next.respace();
  };
  _.backspace = function() {
    clearUpDownCache(this);
    this.show();

    if (this.deleteSelection()); // pass
    else if (this.prev) {
      if (this.prev.isEmpty())
        this.prev = this.prev.remove().prev;
      else
        this.selectLeft();
    }
    else if (this.parent !== this.root) {
      if (this.parent.parent.isEmpty())
        return this.insertAfter(this.parent.parent).backspace();
      else
        this.unwrapGramp();
    }

    if (this.prev)
      this.prev.respace();
    if (this.next)
      this.next.respace();
    this.parent.bubble('redraw');

    return this;
  };
  _.deleteForward = function() {
    clearUpDownCache(this);
    this.show();

    if (this.deleteSelection()); // pass
    else if (this.next) {
      if (this.next.isEmpty())
        this.next = this.next.remove().next;
      else
        this.selectRight();
    }
    else if (this.parent !== this.root) {
      if (this.parent.parent.isEmpty())
        return this.insertBefore(this.parent.parent).deleteForward();
      else
        this.unwrapGramp();
    }

    if (this.prev)
      this.prev.respace();
    if (this.next)
      this.next.respace();
    this.parent.bubble('redraw');

    return this;
  };
  _.selectFrom = function(anticursor) {
    //find ancestors of each with common parent
    var oneA = this, otherA = anticursor; //one ancestor, the other ancestor
    loopThroughAncestors: while (true) {
      for (var oneI = this; oneI !== oneA.parent.parent; oneI = oneI.parent.parent) //one intermediate, the other intermediate
        if (oneI.parent === otherA.parent) {
          left = oneI;
          right = otherA;
          break loopThroughAncestors;
        }

      for (var otherI = anticursor; otherI !== otherA.parent.parent; otherI = otherI.parent.parent)
        if (oneA.parent === otherI.parent) {
          left = oneA;
          right = otherI;
          break loopThroughAncestors;
        }

      if (oneA.parent.parent)
        oneA = oneA.parent.parent;
      if (otherA.parent.parent)
        otherA = otherA.parent.parent;
    }
    //figure out which is left/prev and which is right/next
    var left, right, leftRight;
    if (left.next !== right) {
      for (var next = left; next; next = next.next) {
        if (next === right.prev) {
          leftRight = true;
          break;
        }
      }
      if (!leftRight) {
        leftRight = right;
        right = left;
        left = leftRight;
      }
    }
    this.hide().selection = Selection(left.prev.next || left.parent.firstChild, right.next.prev || right.parent.lastChild);
    this.insertAfter(right.next.prev || right.parent.lastChild);
    this.root.selectionChanged();
  };
  _.selectLeft = function() {
    clearUpDownCache(this);
    if (this.selection) {
      if (this.selection.first === this.next) { //if cursor is at left edge of selection;
        if (this.prev) //then extend left if possible
          this.hopLeft().selection.extendLeft();
        else if (this.parent !== this.root) //else level up if possible
          this.insertBefore(this.parent.parent).selection.levelUp();
      }
      else { //else cursor is at right edge of selection, retract left if possible
        this.hopLeft();
        if (this.selection.first === this.selection.last) {
          this.clearSelection().show(); //clear selection if retracting to nothing
          return; //skip this.root.selectionChanged(), this.clearSelection() does it anyway
        }
        this.selection.retractLeft();
      }
    }
    else {
      if (this.prev)
        this.hopLeft();
      else //end of a block
        if (this.parent !== this.root)
          this.insertBefore(this.parent.parent);
        else
          return;

      this.hide().selection = Selection(this.next);
    }
    this.root.selectionChanged();
  };
  _.selectRight = function() {
    clearUpDownCache(this);
    if (this.selection) {
      if (this.selection.last === this.prev) { //if cursor is at right edge of selection;
        if (this.next) //then extend right if possible
          this.hopRight().selection.extendRight();
        else if (this.parent !== this.root) //else level up if possible
          this.insertAfter(this.parent.parent).selection.levelUp();
      }
      else { //else cursor is at left edge of selection, retract right if possible
        this.hopRight();
        if (this.selection.first === this.selection.last) {
          this.clearSelection().show(); //clear selection if retracting to nothing
          return; //skip this.root.selectionChanged(), this.clearSelection() does it anyway
        }
        this.selection.retractRight();
      }
    }
    else {
      if (this.next)
        this.hopRight();
      else //end of a block
        if (this.parent !== this.root)
          this.insertAfter(this.parent.parent);
        else
          return;

      this.hide().selection = Selection(this.prev);
    }
    this.root.selectionChanged();
  };

  function clearUpDownCache(self) {
    self.upDownCache = {};
  }

  _.prepareMove = function() {
    clearUpDownCache(this);
    return this.show().clearSelection();
  };

  _.prepareEdit = function() {
    clearUpDownCache(this);
    return this.show().deleteSelection();
  }

  _.clearSelection = function() {
    if (this.selection) {
      this.selection.clear();
      delete this.selection;
      this.root.selectionChanged();
    }
    return this;
  };
  _.deleteSelection = function() {
    if (!this.selection) return false;

    this.prev = this.selection.first.prev;
    this.next = this.selection.last.next;
    this.selection.remove();
    this.root.selectionChanged();
    return delete this.selection;
  };
});

var Selection = P(MathFragment, function(_, _super) {
  _.init = function() {
    var frag = this;
    _super.init.apply(frag, arguments);

    frag.jQwrap(frag.jQ);
  };
  _.jQwrap = function(children) {
    this.jQ = children.wrapAll('<span class="selection"></span>').parent();
      //can't do wrapAll(this.jQ = $(...)) because wrapAll will clone it
  };
  _.adopt = function() {
    this.jQ.replaceWith(this.jQ = this.jQ.children());
    return _super.adopt.apply(this, arguments);
  };
  _.clear = function() {
    this.jQ.replaceWith(this.jQ.children());
    return this;
  };
  _.levelUp = function() {
    var seln = this,
      gramp = seln.first = seln.last = seln.last.parent.parent;
    seln.clear().jQwrap(gramp.jQ);
    return seln;
  };
  _.extendLeft = function() {
    this.first = this.first.prev;
    this.first.jQ.prependTo(this.jQ);
  };
  _.extendRight = function() {
    this.last = this.last.next;
    this.last.jQ.appendTo(this.jQ);
  };
  _.retractRight = function() {
    this.first.jQ.insertBefore(this.jQ);
    this.first = this.first.next;
  };
  _.retractLeft = function() {
    this.last.jQ.insertAfter(this.jQ);
    this.last = this.last.prev;
  };
});
/*********************************************************
 * The actual jQuery plugin and document ready handlers.
 ********************************************************/

//The publicy exposed method of jQuery.prototype, available (and meant to be
//called) on jQuery-wrapped HTML DOM elements.
$.fn.mathquill = function(cmd, latex) {
  switch (cmd) {
  case 'redraw':
    return this.each(function() {
      var blockId = $(this).attr(mqBlockId),
        rootBlock = blockId && MathElement[blockId];
      if (rootBlock) {
        (function postOrderRedraw(el) {
          el.eachChild(postOrderRedraw);
          if (el.redraw) el.redraw();
        }(rootBlock));
      }
    });
  case 'revert':
    return this.each(function() {
      var blockId = $(this).attr(mqBlockId),
        block = blockId && MathElement[blockId];
      if (block && block.revert)
        block.revert();
    });
  case 'latex':
    if (arguments.length > 1) {
      return this.each(function() {
        var blockId = $(this).attr(mqBlockId),
          block = blockId && MathElement[blockId];
        if (block)
          block.renderLatex(latex);
      });
    }

    var blockId = $(this).attr(mqBlockId),
      block = blockId && MathElement[blockId];
    return block && block.latex();
  case 'text':
    var blockId = $(this).attr(mqBlockId),
      block = blockId && MathElement[blockId];
    return block && block.text();
  case 'html':
    return this.html().replace(/ ?hasCursor|hasCursor /, '')
      .replace(/ class=(""|(?= |>))/g, '')
      .replace(/<span class="?cursor( blink)?"?><\/span>/i, '')
      .replace(/<span class="?textarea"?><textarea><\/textarea><\/span>/i, '');
  case 'write':
    if (arguments.length > 1)
      return this.each(function() {
        var blockId = $(this).attr(mqBlockId),
          block = blockId && MathElement[blockId],
          cursor = block && block.cursor;

        if (cursor)
          cursor.writeLatex(latex).parent.blur();
      });
  case 'cmd':
    if (arguments.length > 1)
      return this.each(function() {
        var blockId = $(this).attr(mqBlockId),
          block = blockId && MathElement[blockId],
          cursor = block && block.cursor;

        if (cursor) {
          cursor.show();
          if (/^\\[a-z]+$/i.test(latex)) {
            var selection = cursor.selection;
            if (selection) {
              cursor.prev = selection.first.prev;
              cursor.next = selection.last.next;
              delete cursor.selection;
            }
            cursor.insertCmd(latex.slice(1), selection);
          }
          else
            cursor.insertCh(latex);
          cursor.hide().parent.blur();
        }
      });
  default:
    var textbox = cmd === 'textbox',
      editable = textbox || cmd === 'editable',
      RootBlock = textbox ? RootTextBlock : RootMathBlock;
    return this.each(function() {
      createRoot($(this), RootBlock(), textbox, editable);
    });
  }
};

//on document ready, mathquill-ify all `<tag class="mathquill-*">latex</tag>`
//elements according to their CSS class.
$(function() {
  $('.mathquill-editable:not(.mathquill-rendered-math)').mathquill('editable');
  $('.mathquill-textbox:not(.mathquill-rendered-math)').mathquill('textbox');
  $('.mathquill-embedded-latex').mathquill();
});


}());
;Drupal.behaviors.sTinymceMathquill = function(context){
  // initialize formula editor elements
  $('.s-formula-editable:not(.sTinymceMathquill-processed)', context).addClass('sTinymceMathquill-processed').each(function(){
    sMathquill.initMathquill(this);
  });

  var popup = Popups.activePopup();
  if(!popup || !$('#' + popup.id).hasClass('tinymce-mathquill-formula-popup')) return;

  var latexLoading = false;

  $('.submit-btn', context).click(function(e){
    e.preventDefault();

    var realm = tinyMCE.activeEditor.execCommand('sContentGetRealmFromUrl');
    var latex = sMathquill.save();

    if(latex && latex.length && !latexLoading){
      var encodedFormula = Base64.encode(latex);
      latexLoading = true;
      $.ajax({
        url: '/tinymceinsertlatex',
        type: 'POST',
        dataType: 'json',
        data: { save_formula: 1 , realm: realm[0], realm_id: realm[1], formula: latex },
        success: function( data, status, xhr ){
          latexLoading = false;
          if( data.error ) {
            alert( data.error );
          }
          else {
            // remove the modded formula image
            var old_image = $(document).data('s_content_saved_formula_image');
            if(old_image) {
              $(old_image).remove();
              // clear out the lastNode value
              tinyMCE.activeEditor.execCommand('sContentSaveLastNode');
            }

            $(document).data('s_content_saved_formula_image',null);
            
            Popups.close();

            var imgElement = '<img src="' + data.content_path + '" formula="' + encodedFormula + '" class="mathquill-formula" />';
            tinyMCE.activeEditor.execCommand('sContentInsert' , imgElement, {use_native_insert: true});
          }
        }
      });
    }
  });
};

if(typeof sMathquill == 'undefined'){
  sMathquill = (function(){
    var obj = {};
    obj.editors = [];
    obj.activeEditor = null;
    obj.config = {};
    obj.menuItemList = {};

    /**
     * Initialize a new markup element to be placed in a menu bar
     *
     * @param object cfg
     */
    _newMarkup = function(cfg){
      return {
        type: 'markup',
        html: cfg.html
      };
    };

    /**
     * Initialize a new command button
     * Executes a command in Mathquill and triggers a refocus.
     *
     * @param object cfg
     */
    _newCommandButton = function(cfg){
      var cmd = typeof cfg.cmd == 'object' ? cfg.cmd.join('') : cfg.cmd;
      return {
        type: 'button',
        extraClass: 's-mq-btn s-mq-icon',
        label: cmd,
        tooltip: cmd.replace('\\', ''),
        fn: function(args){
          args.event.preventDefault();
          if(typeof cfg.cmd == 'object'){
            $.each(cfg.cmd, function(k, cmd){
              args.editor.mathquill('cmd', cmd);
            });
          }
          else{
            args.editor.mathquill('cmd', cfg.cmd);
          }
          args.editor.trigger('focus');
        }
      };
    };

    /**
     * Initialize a new text button
     * Executes a write in Mathquill and triggers a refocus.
     *
     * @param object cfg
     */
    _newTextButton = function(cfg){
      return {
        type: 'button',
        extraClass: 's-mq-btn s-mq-icon',
        label: cfg.text,
        tooltip: cfg.text,
        fn: function(args){
          args.event.preventDefault();
          args.editor.mathquill('write', cfg.text);
          args.editor.trigger('focus');
        }
      };
    };

    /**
     * Initialize a new menu toggle button that toggles visibility of sub menus and refocuses on the editor
     *
     * @param object cfg
     */
    _newMenuToggleButton = function(cfg){
      var menuClass = 's-mq-' + cfg.key.replace(/_/g, '-').toLowerCase();
      return {
        type: 'button',
        extraClass: 's-mq-btn s-mq-menu-toggle',
        label: cfg.label,
        tooltip: cfg.label,
        fn: function(args){
          var e = args.event,
              ed = args.editor;
          e.preventDefault();
          var btnObj = $(this);
          if(btnObj.hasClass('active')){
            //closing a menu
            btnObj.removeClass('active');
            ed.siblings('.s-mq-submenu.' + menuClass).addClass('hidden');
          }
          else{
            //opening a menu
            btnObj.addClass('active')
                  .siblings('.s-mq-menu-toggle')
                  .removeClass('active');
            var subMenus = ed.siblings('.s-mq-submenu');
            subMenus.not('.' + menuClass).addClass('hidden');
            subMenus.filter('.' + menuClass).removeClass('hidden');
          }
          obj.resize();
          ed.trigger('focus');
        }
      };
    };

    /**
     * Initialize a default button.
     * This just adds an element to the DOM, any bindings will be done externally.
     * Function may be passed in to the fn member of cfg.
     *
     * @param object cfg
     */
    _newDefaultButton = function(cfg){
      var btn = {
        type: 'button',
        label: cfg.label,
        extraClass: 's-mq-btn'
      };
      if(typeof cfg.fn == 'function'){
        btn.fn = cfg.fn;
      }
      return btn
    };

    /**
     * Initialize Mathquill editor on a given element
     *
     * @param string/object selector or DOM element
     * @param object opts
     */
    obj.initMathquill = function(element, opts){
      var menuBars = null;
      if(typeof opts == 'undefined'){
        var opts = {};
      }
      var defaults = {
        editable: true,
        autoHeight: false
      };
      opts = $.extend(defaults, opts);

      // initialize Mathquill on the given element
      var el = $(element);
      if(opts.editable){
        el.index = obj.editors.length;
        el.menuBars = [];
        el.hooks = {};
        el.opts = opts;

        _execAllHooks('onBeforeEditorCreate', [el]);

        el.mathquill('editable');

        el.initialHeight = el.innerHeight();

        // set this element as the active editor
        obj.activeEditor = el;

        // bind the focus event to help identify the current editor
        el.find('textarea').bind('focus', function(){
          obj.activeEditor = el;
        });

        // add a command bar with a bunch of default buttons
        if(typeof obj.config.menu_bars != 'undefined'){
          $.each(obj.config.menu_bars, function(name, cfg){
            cfg.name = name;
            obj.addMenuBar(cfg);
          });
          this.resize();
        }

        obj.editors.push(el);

        _execAllHooks('onEditorCreate', [el]);
      }
      else{
        el.mathquill();
      }
      return el;
    };

    /**
     * Add a command bar to the active editor
     *
     * @param object opts
     *   string menuItem  comma separated list of keys representing a menu item
     *
     * @return object
     */
    obj.addMenuBar = function(opts){
      var ed = obj.activeEditor,
          menuItems = [];
      if(!ed){
        return;
      }

      if(typeof opts == 'undefined'){
        var opts = {};
      }
      var defaults = {
        submenu: false,
        multiline: false
      };
      opts = $.extend(defaults, opts);
      if(typeof opts.menu_items == 'object'){
        opts.menu_items = opts.menu_items.join(',');
      }
      if(typeof opts.menu_items == 'string'){
        $.each(opts.menu_items.split(','), function(idx, key){
          if(new_item = obj.getMenuItem(key)){
            menuItems.push(new_item);
          }
        });
      }

      var newBarObj = $('<div/>').addClass('s-mq-menu-bar');
      // newBarObj.width(ed.outerWidth() - 2);

      if(typeof opts.name == 'string'){
        newBarObj.addClass('s-mq-menu-' + opts.name.replace(/_/g, '-').toLowerCase());
      }

      if(typeof opts.submenu != 'undefined' && opts.submenu){
        newBarObj.addClass('s-mq-submenu').addClass('hidden');
      }

      if(typeof opts.multiline != 'undefined' && opts.multiline){
        newBarObj.addClass('s-mq-menu-multiline');
      }

      // put the menuItems in the menu bar if there are any
      if(menuItems.length){
        $.each(menuItems, function(i, menuItem){
          var newMenuItem = null;
          switch(menuItem.type){
            case 'button':
              newMenuItem = obj.addButtonToMenuBar(newBarObj, menuItem);
              break;

            case 'markup':
              newBarObj.append(menuItem.html);
              break;
          }

          if(!opts.submenu && newMenuItem){
            newMenuItem.addClass('s-mq-menu-item');
          }
        });
      }

      if(typeof opts.extraClass == 'string'){
        newBarObj.addClass(opts.extraClass);
      }

      newBarObj.insertBefore(ed);

      ed.menuBars.push(newBarObj);

      return newBarObj;
    };

    /**
     * Add a button to the menu bar
     *
     * @param int/object menuBar  provide int to reference a menu bar in the active editor
     *                            provide object of the menu bar object
     * @param object btn
     *
     * @return object
     */
    obj.addButtonToMenuBar = function(menuBar, btn){
      var menuBarObj = null,
          ed = obj.activeEditor;

      // set the menuBarObj by determining whether an object was passed or an int to reference the menuBar in the current editor
      if(typeof menuBar == 'object'){
        if(menuBar.hasClass('s-mq-menu-bar')){
          menuBarObj = menuBar;
        }
      }
      else if(typeof menuBar == 'number') {
        if(ed && typeof ed.menuBars[menuBar] == 'object'){
          menuBarObj = ed.menuBars[menuBar];
        }
      }

      if(!menuBarObj){
        return null;
      }

      var defaults = {
        label: '',
        extraClass: '',
        size: 20,
        fn: function() {}
      };
      btn = $.extend(defaults, btn);

      var btnObj = $('<span/>').bind('click', function(e){
        btn.fn.apply(this, [{editor: ed, event: e}]);
      });
      btnLabel = $('<span/>').addClass('s-mq-label').appendTo(btnObj);

      if(btn.label.length){
        btnLabel.text(btn.label);
      }

      if(btn.tooltip.length){
        btnObj.attr('title', btn.tooltip);
      }

      if(btn.extraClass.length){
        btnObj.addClass(btn.extraClass);
      }

      btnObj.addClass('s-mq-size' + btn.size);

      if(btnObj.hasClass('s-mq-embed')){
        // has latex command embedded
        // need to run mathquill on the label text and render it
        var renderedHTML = $('<span/>').text(btnLabel.text()).mathquill('editable').mathquill('html');
        btnLabel.html(renderedHTML).addClass('mathquill-rendered-math');
      }
      else{
        // does an html entities decode
        btnLabel.html(btnLabel.text());
      }

      btnObj.appendTo(menuBarObj);

      if(typeof btn.onAdd == 'function'){
        btn.onAdd.apply(obj, [btnObj]);
      }

      return btnObj;
    };

    /**
     * Retrieve the menu item object given the key.
     *
     * @param string key  unique key that defines a menu item
     */
    obj.getMenuItem = function(key){
      var template = null,
          cfg = null;
      if(typeof this.menuItemList[key] == 'undefined'){
        if(key.length){
          // if there is no config for it, create a standard command button
          cfg = {
            key: key,
            cmd: '\\' + key
          };
        }
      }
      else {
        cfg = this.menuItemList[key];
      }

      if(cfg){
        cfg.key = key;
        if(typeof cfg.html != 'undefined'){
          template = _newMarkup(cfg);
        }
        else if(typeof cfg.cmd != 'undefined'){
          // command button will trigger a cmd and refocus on the editor
          template = _newCommandButton(cfg);
        }
        else if(typeof cfg.text == 'string'){
          // text button will trigger a text call and refocus on the editor
          template = _newTextButton(cfg);
        }
        else if(typeof cfg.menu_toggle != 'undefined'){
          template = _newMenuToggleButton(cfg);
        }
        else{
          template = _newDefaultButton(cfg);
        }

        if(typeof template == 'object' && template){
          if(typeof template.extraClass == 'undefined'){
            template.extraClass = '';
          }

          // give the menu item a class with its key
          template.extraClass += ' s-mq-' + cfg.key.replace(/_/g, '-').toLowerCase();

          // can set the compile_label to false to prevent mathquilling the contents
          if(typeof cfg.compile_label != 'boolean' || cfg.compile_label){
            template.extraClass += ' s-mq-embed';
          }

          if(typeof cfg.extraClass == 'string'){
            template.extraClass += ' ' + cfg.extraClass;
          }

          // the tooltip that appears on mouseover
          if(typeof cfg.tooltip != 'undefined'){
            // use the tooltip that is defined in the config
            template.tooltip = cfg.tooltip;
          }
          else if(typeof template.tooltip == 'undefined'){
            // use the label as a
            template.tooltip = typeof template.label != 'undefined' ? template.label : key;
          }

          // use the label that is defined in the config
          if(typeof cfg.label != 'undefined'){
            template.label = cfg.label;
          }
        }
      }

      return template;
    };


    /**
     * Adjust the size of the editor to fit the menu bars.
     */
    obj.resize = function(){
      var ed = obj.activeEditor;
      if(ed && typeof ed.initialHeight != 'undefined' && typeof ed.opts.autoHeight != 'undefined' && ed.opts.autoHeight){
        var height = ed.initialHeight;
        if(ed.menuBars.length){
          $.each(ed.menuBars, function(k, menuBar){
            if(menuBar.is(':visible')){
              height -= menuBar.outerHeight();
            }
          });

          ed.height(height);
        }
      }
    };

    /**
     * Execute a command on the active editor if there is one.
     *
     * @param string cmd
     * @param mixed,... args
     */
    obj.exec = function(){
      var ed;
      if(ed = this.activeEditor){
        var args = Array.prototype.slice.call(arguments);
        return ed.mathquill.apply(ed, args);
      }

      return null;
    };

    /**
     * Convenience method to write to the active editor
     *
     * @param string latex
     */
    obj.write = function(latex){
      return obj.exec('write', latex);
    };

    /**
     * Convenience method for executing a Mathquill command on the active editor.
     *
     * @param string cmd
     */
    obj.cmd = function(cmd){
      return obj.exec('cmd', cmd);
    };

    /**
     * Convenience method for resetting the contents of the active editor.
     */
    obj.reset = function(){
      return obj.exec('revert');
    };

    /**
     * Convenience method to retrieve the latex representation of the formula in the active editor
     */
    obj.getLatex = function(){
      return obj.exec('latex');
    };

    /**
     * Convenience method to retrieve the HTML representation of the formula in the active editor
     */
    obj.getHTML = function(){
      return obj.exec('html');
    };

    /**
     * Saves the content.
     * Returns the final LaTeX after hooks have been run
     */
    obj.save = function(){
      var output = { latex: obj.getLatex() };
      // passing output as object so it will be passed to all hooks by reference and not by value
      _execAllHooks('onSave', [obj.activeEditor, output]);
      return output.latex;
    };

    var hook_namespaces = {};

    /**
     * Register a hook to the provided namespace and event queue.
     * May also provide an argument list as an array
     *
     * @param string namespace
     * @param string event
     * @param function fn
     */
    _addHook = function(namespace, event, fn){
      if(typeof hook_namespaces[namespace] == 'undefined'){
        hook_namespaces[namespace] = {};
      }
      if(typeof hook_namespaces[namespace][event] == 'undefined'){
        hook_namespaces[namespace][event] = [fn];
      }
      else{
        hook_namespaces[namespace][event].push(fn);
      }
    };

    /**
     * Execute the hooks associated with the event.
     * May also provide an argument list as an array
     *
     * @param string namespace
     * @param string event
     * @param array args
     */
    _execHooks = function(namespace, event, args){
      if(typeof hook_namespaces[namespace] == 'undefined'){
        return;
      }

      if(typeof hook_namespaces[namespace][event] == 'undefined'){
        return;
      }

      var hook_queue = hook_namespaces[namespace][event];

      if(typeof args == 'undefined'){
        var args = [];
      }

      $.each(hook_queue, function(k, fn){
        fn.apply(obj, args);
      });
    };

    /**
     * Execute the hooks associated with the event in the global namespace.
     * May also provide an argument list as an array
     *
     * @param string event
     * @param array args
     */
    _execGlobalHooks = function(event, args){
      _execHooks('global', event, args);
    };

    /**
     * Execute the hooks associated with the event for the current editor.
     * May also provide an argument list as an array
     *
     * @param string event
     * @param array args
     */
    _execEditorHooks = function(event, args){
      var ed = obj.activeEditor;

      if(ed){
        _execHooks('editor_' + ed.index, event, args);
      }
    };

    /**
     * Execute the hooks in all namespces for the given event
     * May also provide an argument list as an array
     *
     * @param string event
     * @param array args
     */
    _execAllHooks = function(event, args){
      $.each(hook_namespaces, function(namespace, queues){
        _execHooks(namespace, event, args);
      });
    };

    /**
     * Register a hook to be called in an event that's not associated with an editor
     *
     * @param string event
     * @param function fn
     */
    obj.addGlobalHook = function(event, fn){
      _addHook('global', event, fn);
    };

    /**
     * Register a hook to be called in an event on the current active editor
     *
     * @param string event
     * @param function fn
     */
    obj.addEditorHook = function(event, fn){
      var ed = obj.activeEditor;
      if(ed){
        _addHook('editor_' + ed.index, event, fn);
      }
    };

    return obj;
  })();

  /**
   * Mathquill editor configuration
   */
  sMathquill.config = {
    menu_bars: {}
  };

  /**
   * a list of menu item definitions
   *
   * string html - an html markup that can be inserted into a menu bar
   * string cmd - a Mathquill command that runs as a result of clicking on the button. creates a command button
   * string text - a Mathquill "write" that runs as a result of clicking on the button. creates a text button
   *
   * bool menu_toggle - the button is treated as a toggle, creates a menu toggle button
   * bool compile_label - defaults true. set to false to prevent the label from being compiled in Mathquill
   *
   * string label - the text that appears on the control
   * string tooltip - the text that appears on mouseover
   */
  sMathquill.menuItemList = {
    // markup
    _line_break:        { html: '<br/>' },
    _separator:         { html: '<span class="s-mq-separator"></span>' }
  };

  /**
   * Main menu buttons and cluetip roll-over on the buttons
   */
  (function(obj){
    var mainMenuConfig = {
      // main menus
      main: {
        menu_items: [
          // 'menu_greek,menu_operators,menu_relationships,menu_equations,menu_arrows,menu_misc'
          'menu_operators,menu_relationships,menu_equations,menu_arrows,menu_misc,menu_greek'
        ]
      },

      // sub menus
      greek: {
        submenu: true,
        multiline: true,
        menu_items: [
          'alpha,beta,gamma,delta,epsilon,zeta,eta,theta,iota,kappa,lambda,mu,nu,xi,omicron,pi,rho,sigma,tau,upsilon,phi,chi,psi,omega',
          'digamma,varepsilon,varkappa,varphi,varpi,varrho,varsigma,vartheta',
          'Gamma,Delta,Theta,Lambda,Xi,Pi,Sigma,Upsilon,Phi,Psi,Omega'
        ]
      },
      operators: {
        submenu: true,
        multiline: true,
        menu_items: [
          'equal,plus,minus,ast,cdot,times,div,pm,mp,therefore,because',
          'bigcirc,diamond,amalg,odot,ominus,oplus,otimes,wr',
          'union,intersect,uplus,sqcap,sqcup,wedge,vee,dagger,ddagger',
          'lhd,rhd,bigtriangledown,bigtriangleup'
        ]
      },
      relationships: {
        submenu: true,
        multiline: true,
        menu_items: [
          'equiv,cong,neq,sim,simeq,approx,napprox,doteq,models',
          'leq,prec,preceq,lt,ll,subset,subseteq,nsubset,nsubseteq,sqsubset,sqsubseteq,dashv,in,notin',
          'geq,succ,succeq,gt,gg,supset,supseteq,nsupset,nsupseteq,sqsupset,sqsupseteq,vdash,ni,notni',
          'mid,parallel,nparallel,perp,bowtie,smile,frown,propto,exists,nexists,varnothing'
        ]
      },
      equations: {
        submenu: true,
        multiline: true,
        menu_items: [
          'frac,fprime,sqrt,nthroot,supscript,subscript,curly_braces,angle_brackets,lfloor,rfloor,lceil,rceil,slash',
          'sum,prod,coprod,limit,int,oint,binomial,vector,prime'
        ]
      },
      arrows: {
        submenu: true,
        multiline: true,
        menu_items: [
          'leftarrow,Leftarrow,rightarrow,Rightarrow,leftrightarrow,Leftrightarrow',
          'longleftarrow,Longleftarrow,longrightarrow,Longrightarrow,longleftrightarrow,Longleftrightarrow',
          'rightleftarrows,uparrow,Uparrow,downarrow,Downarrow,updownarrow,Updownarrow',
          'mapsto,hookleftarrow,leftharpoonup,leftharpoondown,hookrightarrow,rightharpoonup,rightharpoondown',
          'nearrow,searrow,swarrow,nwarrow'
        ]
      },
      misc: {
        submenu: true,
        multiline: true,
        menu_items: [
          'infty,nabla,partial,clubsuit,diamondsuit,heartsuit,spadesuit,cdots,vdots,ldots,ddots,imaginary,real',
          'forall,reals,complex,naturals,rationals,integers,ell,sharp,flat,natural,hbar,surd,wp',
          'angle,measuredangle,overline,overrightarrow,overleftrightarrow,triangle,top,bot,caret,underscore,backslash,vert,AA',
          'circ,bullet,setminus,neg,dots,aleph,deg'
        ]
      }
    };
    var mainMenuButtons = {
      menu_greek:         { menu_toggle: true,
                            label: '\\alpha \\pi \\Delta',
                            tooltip: Drupal.t('Greek'),
                            extraClass: 's-mq-embed' },
      menu_operators:     { menu_toggle: true,
                            label: '\\pm\\times=',
                            tooltip: Drupal.t('Operators'),
                            extraClass: 's-mq-embed' },
      menu_relationships: { menu_toggle: true,
                            label: '\\leq\\ne\\in',
                            tooltip: Drupal.t('Relationships'),
                            extraClass: 's-mq-embed' },
      menu_equations:     { menu_toggle: true,
                            compile_label: false,
                            label: '<var class="florin">ƒ</var>'
                                 + '<span>\'</span>'
                                 + '<span class="non-leaf">{ }</span>'
                                 + '<span class="non-leaf">'
                                   + '<span class="scaled sqrt-prefix">√</span>'
                                   + '<span class="non-leaf sqrt-stem">'
                                     + '<var>x</var>'
                                   + '</span>'
                                 + '</span>',
                            tooltip: Drupal.t('Equations'),
                            extraClass: 'mathquill-rendered-math' },
      menu_arrows:        { menu_toggle: true,
                            label: '\\Leftarrow\\updownarrow\\Rightarrow',
                            tooltip: Drupal.t('Arrows'),
                            extraClass: 's-mq-embed' },
      menu_misc:          { menu_toggle: true,
                            label: '\\infty\\angle\\partial',
                            tooltip: Drupal.t('Miscellaneous'),
                            extraClass: 's-mq-embed' },

      // common mathematical syntax
      limit:              { cmd: ['\\lim', '_'] },
      abs:                { cmd: '|' },

      // arithmetic
      plus:               { cmd: '+' },
      minus:              { cmd: '-' },
      equal:              { cmd: '=' },

      //greek letters
      omicron:            { text: 'o', compile_label: false },

      frac:               { cmd: '\\frac', label: '\\frac{x}{y}' },
      limit:              { cmd: ['\\lim', '_'], label: '\\lim', tooltip: Drupal.t('lim') },
      fprime:             { cmd: ['f', '\''] },
      sqrt:               { cmd: '\\sqrt',
                            compile_label: false,
                            label: '<span class="non-leaf">'
                                   + '<span class="scaled sqrt-prefix">√</span>'
                                   + '<span class="non-leaf sqrt-stem">'
                                     + '<var>x</var>'
                                   + '</span>'
                                 + '</span>',
                            extraClass: 'mathquill-rendered-math' },
      nthroot:            { cmd: '\\nthroot',
                            compile_label: false,
                            label: '<sup class="nthroot non-leaf">'
                                   + '<var>x</var>'
                                 + '</sup>'
                                 + '<span class="scaled">'
                                   + '<span class="sqrt-prefix scaled">√</span>'
                                   + '<span class="sqrt-stem non-leaf">'
                                     + '<var>y</var>'
                                   + '</span>'
                                 + '</span>',
                            extraClass: 'mathquill-rendered-math' },
      subscript:          { cmd: '_', label: 'x_y', tooltip: Drupal.t('subscript') },
      supscript:          { cmd: '^', label: 'x^y', tooltip: Drupal.t('superscript') },
      curly_braces:       { cmd: '{', label: '{ }', tooltip: '{ }', compile_label: false, extraClass: 'mathquill-rendered-math' },
      angle_brackets:     { cmd: '\\langle', label: '⟨ ⟩', compile_label: false, extraClass: 'mathquill-rendered-math' },
      binomial:           { cmd: '\\binomial',
                            compile_label: false,
                            label: '(<span class="non-leaf">'
                                   + '<span class="array non-leaf">'
                                     + '<span class="s-mq-var">x</span>'
                                     + '<span class="s-mq-var">y</span>'
                                   + '</span>'
                                 + '</span>)',
                            extraClass: 'mathquill-rendered-math' },
      vector:             { cmd: '\\vector', label: '\\vector{a} \\vector{b}{c}' },

      // geometric lines, rays, and line segments
      overline:           { cmd: '\\overline', label: '\\overline{AB}' },
      overrightarrow:     { cmd: '\\overrightarrow', label: '\\overrightarrow{AB}' },
      overleftrightarrow: { cmd: '\\overleftrightarrow', label: '\\overleftrightarrow{AB}' }
    };

    obj.config.menu_bars = $.extend(obj.config.menu_bars, mainMenuConfig);
    obj.menuItemList = $.extend(obj.menuItemList, mainMenuButtons);

    /**
     * Apply the cluetip effect on the menu items when the editor gets created
     */
    obj.addGlobalHook('onEditorCreate', function(ed){
      var mainMenu = ed.siblings('.s-mq-menu-main');
      mainMenu.children('.s-mq-menu-toggle').each(function(){
        var toggleBtn = $(this);
        toggleBtn.tipsy({
          gravity: 's',
          title: function(){
            return toggleBtn.attr('original-title');
          }
        });
      });
    });
  }(sMathquill));

  /**
   * Add a font re-sizing plugin
   *
   * LaTeX supports 10 different font sizes using certain commands listed in fontSizeMapping.
   * The font size index will be stored as an index to that mapping and is saved per editor.
   */
  (function(obj){
    var DEFAULT_SIZE = 5;
    var fontSizeMapping = [
      { cmd: '\\tiny', font_size: '10px' },
      { cmd: '\\scriptsize', font_size: '11px' },
      { cmd: '\\footnotesize', font_size: '12px' },
      { cmd: '\\small', font_size: '14px' },
      { font_size: '16px' },
      { cmd: '\\large', font_size: '18px' },
      { cmd: '\\Large', font_size: '24px' },
      { cmd: '\\LARGE', font_size: '28px' },
      { cmd: '\\huge', font_size: '34px' },
      { cmd: '\\Huge', font_size: '40px' }
    ];
    var mappingByCommand = {};
    $.each(fontSizeMapping, function(idx, size){
      if(typeof size.cmd != 'undefined'){
        mappingByCommand[size.cmd.substr(1)] = idx;
      }
    });

    // editor font sizes by editor index
    var editorSizes = [];

    _getEditorFontSize = function(ed){
      var ret = null;
      if(ed && typeof ed.index != 'undefined'){
        ret = editorSizes[ed.index];
      }
      return ret;
    };

    _setEditorFontSize = function(ed, size){
      if(ed && typeof ed.index != 'undefined' && typeof fontSizeMapping[size] != 'undefined'){
        editorSizes[ed.index] = size;
      }
    };

    /**
     * Given a LaTeX input, parse out a potential size command.
     *
     * @param string latex
     * @return string
     */
    _getSizeString = function(latex){
      var matches = latex.match(/\\(tiny|scriptsize|small|normalsize|large|Large|LARGE|huge|Huge)/);
      if(matches && typeof mappingByCommand[matches[1]] != 'undefined'){
        return matches[1];
      }
      return null;
    };

    /**
     * Attempt to update the font size to the provided size for the current editor
     *
     * @param int newSize
     * @return object
     */
    obj.updateFontSize = function(newSize){
      var ed = obj.activeEditor;

      if(!ed){
        return null;
      }

      // check to prevent out of bound sizes
      if(typeof fontSizeMapping[newSize] != 'undefined'){
        _setEditorFontSize(ed, newSize);
        ed.css('font-size', fontSizeMapping[_getEditorFontSize(ed)].font_size);
      }

      return fontSizeMapping[_getEditorFontSize(ed)];
    };

    /**
     * Increase the font size of the current editor by diff
     *
     * @param int diff
     * @return object
     */
    obj.increaseFontSize = function(diff){
      var ed = obj.activeEditor;

      if(!ed){
        return null;
      }

      return obj.updateFontSize(_getEditorFontSize(ed) + diff);
    };

    // Add a hook to extract any size string that is in the markup and set the default font size
    obj.addGlobalHook('onBeforeEditorCreate', function(element){
      var latex = element.text();
      if(latex.length){
        var sizeString = _getSizeString(latex);
        if(sizeString){
          element.text(latex.replace('\\' + sizeString + ' ', ''));
          _setEditorFontSize(element, mappingByCommand[sizeString]);
        }
      }
    });

    // Add a hook to set the default font size of the new editor
    obj.addGlobalHook('onEditorCreate', function(newEditor){
      if(!_getEditorFontSize(newEditor)){
        _setEditorFontSize(newEditor, DEFAULT_SIZE);
      }
      newEditor.css('font-size', fontSizeMapping[_getEditorFontSize(newEditor)].font_size);

      // tipsy for the font buttons
      var fontBtns = newEditor.siblings('.s-mq-menu-main').children('.s-mq-font-size-down, .s-mq-font-size-up');
      fontBtns.tipsy({
        gravity: 's',
        title: function(){
          return $(this).attr('original-title');
        }
      });
    });

    // Add a hook to prepend the latex output with the corresponding size command
    obj.addGlobalHook('onSave', function(ed, output){
      var editorFontSize = _getEditorFontSize(ed);
      if(typeof editorFontSize != 'undefined' && typeof fontSizeMapping[editorFontSize] != 'undefined'){
        var font = fontSizeMapping[editorFontSize];
        // if there's a command associated with this font size, prepend it to the latex output
        if(typeof font.cmd != 'undefined'){
          output.latex = font.cmd + ' ' + output.latex;
        }
      }
    });

    // Declare and input menu items
    obj.config.menu_bars.main.menu_items.push('font_size_down,font_size_up');
    obj.menuItemList.font_size_down = {
      label: 'A-',
      tooltip: Drupal.t('Decrease Font Size'),
      compile_label: false,
      fn: function(){
        obj.increaseFontSize(-1);
      }
    };
    obj.menuItemList.font_size_up = {
      label: 'A+',
      tooltip: Drupal.t('Increase Font Size'),
      compile_label: false,
      fn: function(){
        obj.increaseFontSize(1);
      }
    };
  }(sMathquill));

  /**
   * Custom help cluetip
   */
  (function(obj){
    var helpMessage = Drupal.t('Select symbols or type in LaTeX code');

    // bind the help cluetip
    obj.addGlobalHook('onEditorCreate', function(newEditor){
      var helpTipObj = newEditor.siblings('.s-mq-menu-main').children('.s-mq-help-tip');
      if(helpTipObj.length){
        helpTipObj.tipsy({
          gravity: 's',
          title: function(){
            return helpMessage;
          }
        });
      }
    });

    obj.config.menu_bars.main.menu_items.push('_help_cluetip');
    obj.menuItemList._help_cluetip = {
      html: '<span class="s-mq-help-tip"><span>?</span></span>'
    };
  }(sMathquill));
};
jQuery.extend({
	

    createUploadIframe: function(id, uri)
	{
			//create frame
            var frameId = 'jUploadFrame' + id;
            
            if(window.ActiveXObject) {
                var io = document.createElement('<iframe id="' + frameId + '" name="' + frameId + '" />');
                if(typeof uri== 'boolean'){
                    io.src = 'javascript:false';
                }
                else if(typeof uri== 'string'){
                    io.src = uri;
                }
            }
            else {
                var io = document.createElement('iframe');
                io.id = frameId;
                io.name = frameId;
            }
            io.style.position = 'absolute';
            io.style.top = '-1000px';
            io.style.left = '-1000px';

            document.body.appendChild(io);

            return io			
    },
    createUploadForm: function(id, fileElementId, d)
	{
		//create form	
		var formId = 'jUploadForm' + id;
		var fileId = 'jUploadFile' + id;
		var form = $('<form  action="" method="POST" name="' + formId + '" id="' + formId + '" enctype="multipart/form-data"></form>');	
		var oldElement = $('#' + fileElementId);
		var newElement = $(oldElement).clone();
		$(oldElement).attr('id', fileId);
		$(oldElement).before(newElement);
		$(oldElement).appendTo(form);
		
		// hidden form elements
		var hiddenInput;
		for(var i in d)
		{
			hiddenInput = $('<input type="hidden" />');
			hiddenInput.attr('id',i);
			hiddenInput.attr('name',i);
			hiddenInput.val(d[i]);
			hiddenInput.appendTo(form);
		}
		
		//set attributes
		$(form).css('position', 'absolute');
		$(form).css('top', '-1200px');
		$(form).css('left', '-1200px');
		$(form).appendTo('body');		
		return form;
    },

    ajaxFileUpload: function(s) {
        // TODO introduce global settings, allowing the client to modify them for all requests, not only timeout		
        s = jQuery.extend({}, jQuery.ajaxSettings, s);
        var id = new Date().getTime()        
		var form = jQuery.createUploadForm(id, s.fileElementId, s.data);
		var io = jQuery.createUploadIframe(id, s.secureuri);
		var frameId = 'jUploadFrame' + id;
		var formId = 'jUploadForm' + id;		
        // Watch for a new set of requests
        if ( s.global && ! jQuery.active++ )
		{
			jQuery.event.trigger( "ajaxStart" );
		}            
        var requestDone = false;
        // Create the request object
        var xml = {}   
        if ( s.global )
            jQuery.event.trigger("ajaxSend", [xml, s]);

        // Wait for a response to come back
        var uploadCallback = function(isTimeout)
		{			
			var io = document.getElementById(frameId);
            try 
			{
				if(io.contentWindow)
				{
					 xml.responseText = io.contentWindow.document.body?io.contentWindow.document.body.innerHTML:null;
                	 xml.responseXML = io.contentWindow.document.XMLDocument?io.contentWindow.document.XMLDocument:io.contentWindow.document;
					 
				}else if(io.contentDocument)
				{
					xml.responseText = io.contentDocument.document.body?io.contentDocument.document.body.innerHTML:null;
                	xml.responseXML = io.contentDocument.document.XMLDocument?io.contentDocument.document.XMLDocument:io.contentDocument.document;
				}						
            }catch(e)
			{
				jQuery.handleError(s, xml, null, e);
			}
            
            if ( xml || isTimeout == "timeout") 
			{				
                requestDone = true;
                var status;
                try {
                    status = isTimeout != "timeout" ? "success" : "error";
                    // Make sure that the request was successful or notmodified
                    if ( status != "error" )
					{
                        // process the data (runs the xml through httpData regardless of callback)
                        var data = jQuery.uploadHttpData( xml, s.dataType );
                        
                        // If a local callback was specified, fire it and pass it the data
                        if ( s.success )
                            s.success( data, status );
    
                        // Fire the global callback
                        if( s.global )
                            jQuery.event.trigger( "ajaxSuccess", [xml, s] );
                    } else
                        jQuery.handleError(s, xml, status);
                } catch(e) 
				{
                    status = "error";
                    jQuery.handleError(s, xml, status, e);
                }

                // The request was completed
                if( s.global )
                    jQuery.event.trigger( "ajaxComplete", [xml, s] );

                // Handle the global AJAX counter
                if ( s.global && ! --jQuery.active )
                    jQuery.event.trigger( "ajaxStop" );

                // Process result
                if ( s.complete )
                    s.complete(xml, status);

                jQuery(io).unbind()

                setTimeout(function()
									{	try 
										{
											$(io).remove();
											$(form).remove();	
											
										} catch(e) 
										{
											jQuery.handleError(s, xml, null, e);
										}									

									}, 100)

                xml = null

            }
        }
        // Timeout checker
        if ( s.timeout > 0 ) 
		{
            setTimeout(function(){
                // Check to see if the request is still happening
                if( !requestDone ) uploadCallback( "timeout" );
            }, s.timeout);
        }
        try 
		{
           // var io = $('#' + frameId);
			var form = $('#' + formId);
			$(form).attr('action', s.url);
			$(form).attr('method', 'POST');
			$(form).attr('target', frameId);
            if(form.encoding)
			{
                form.encoding = 'multipart/form-data';				
            }
            else
			{				
                form.enctype = 'multipart/form-data';
            }			
            $(form).submit();

        } catch(e) 
		{			
            jQuery.handleError(s, xml, null, e);
        }
        if(window.attachEvent){
            document.getElementById(frameId).attachEvent('onload', uploadCallback);
        }
        else{
            document.getElementById(frameId).addEventListener('load', uploadCallback, false);
        } 		
        return {abort: function () {}};	

    },

    uploadHttpData: function( r, type ) {
        var data = !type;
        data = type == "xml" || data ? r.responseXML : r.responseText;

        // If the type is "script", eval it in global context
        if ( type == "script" )
            jQuery.globalEval( data );
        // Get the JavaScript object, if JSON is used.
        if ( type == "json" )
            data = jQuery._afuParseJSON( data );
        // evaluate scripts within html
        if ( type == "html" )
            jQuery("<div>").html(data).evalScripts();
			//alert($('param', data).each(function(){alert($(this).attr('value'));}));
        return data;
    },
    
    _afuParseJSON: function(d)
	{
		d = String(d); if( d == '' ) return '';
		var pd = d.match(/\[acup-open\](.+)\[acup-close\]/);
		var dd = $.parseJSON(pd[1]);
		return dd;
	}    
})

;var s_ajaxFileUpload = function(){

	this.uploadFormAjax = function(d,param_opts){
		if( typeof d == 'undefined' ) d = {};

		var saveDocumentVal = ($('#edit-save-documents:checked').val() !== null) ? "1" : "0";

    var encodeCB = $('#edit-encode-video:checked');
    var encodeVideo = (encodeCB.length == 0 || encodeCB.is(':checked')) ? '1' : '0';

		$.extend(d , {'saveDocument':saveDocumentVal , 'encodeVideo': encodeVideo} );

		var path_parts = String(window.location.pathname).split("/");

		switch(path_parts){
			default:
				d.upload_realm = path_parts[1];
				d.upload_realmId = path_parts[2];
			break;
		}

		var ajax_opts = {};
		var default_opts = {
			url: '/s_ajaxfileupload',
			secureuri: false,
			fileElementId: 'edit-upload-file',
			data: d,
			dataType: 'json',
			success: function (data, status){
		  	if( data.status != 0 ) {
		  	  alert(Drupal.t("There was an internal error. Please try again in a few moments."));
				  return;
			  }

			  var new_url = data.message.replace(/\\/g, '');
		    sAfu.onUpload(new_url);
		  },
			error: function (data, status, e){
			  alert(Drupal.t("There was an internal error. Please try again in a few moments."));
			}
	  };

		$.extend( ajax_opts , default_opts , param_opts );
		$.ajaxFileUpload( ajax_opts );
	}

	/** should be overridden by whatever you want to do after the upload succeeds **/
	this.onUpload = function(new_url){
		//console.log('onUpload: '+String(new_url));
	};
}

window.sAfu = new s_ajaxFileUpload();;Drupal.behaviors.sCourseMaterialsFolders = function(context) {

  // Click behavior for link descriptions, since you can't have <a> tags wrap other <a> tags
  // which would be possible with rich text descriptions
  $('.materials-folder.item-info:not(.sCourseMaterialsFolders-processed)', context).addClass('sCourseMaterialsFolders-processed').each(function(){
    var folder = $(this);
    // Will not trigger if the folder-title doesn't contain an 'a' tag (e.g. permission denied)
    var folderTitleLink = $('.folder-title a', folder);
    var folderDescription = $('.folder-description', folder);
    if(folderDescription.hasClass('description-clickable')){
      folderDescription.bind('click', function(e){
        // Ignore if the target is a link
        if(!$(e.target).is('a')){
          // Use vanilla JS to follow the href
          folderTitleLink[0].click();
        }
      })
    }
  });

  (function(){
    /**
     * Refresh the sortable tbody within the folder tree structure.
     * This is needed to link all the sortable table bodies after a subdirectory is opened.
     * This occurs when dragging an item over a folder for a period of time and a subtree is opened.
     *
     * @param object subtreeContext
     */
    function refreshSortableContent(subtreeContext){
      subtreeContext.closest('#folder-contents-table').find('tbody.ui-sortable').each(function(k, tbodyEl){
        // Make the sortable plugin refresh upon ajax completion
        // (to allow handling of dynamic folder expansion AJAX
        $(tbodyEl).sortable('refresh');
      });
    }

    /**
     * Toggle the visibility of the folder's content based on the expander object.
     *
     * @param object $expander  the expander element that is linked to the folder being expanded
     * @param bool show  whether this is a show or hide operation
     */
    function toggleSubtree($expander, show){
      var $subtree = $expander.siblings('.folder-subtree'),
          $subtreeLinks = $subtree.find('.action-links-wrapper'),
          $description = $expander.parent().find('.s-js-folder-description'),
          $title = $expander.parent().find('.folder-title'),
          show = show || false,
          folderId = $expander.closest('.material-row-folder').attr('id').split('-')[1];

      var easing = 'easeInQuad',
          duration = 300;
      function toggleVisibility(show_subtree){
        if(show_subtree){
          descFunc = 'slideUp';
          subtreeFunc = 'slideDown';
        }
        else{
          descFunc = 'slideDown';
          subtreeFunc = 'slideUp';
        }
        $description[descFunc]({
          duration: duration,
          easing: easing
        });
        // hidding the action links wrapper since they are positioned absolutely and will appear in an unsightly manner
        // during the course of the animation
        $subtreeLinks.hide();
        $subtree[subtreeFunc]({
          duration: duration,
          easing: easing,
          done: function(){
            $subtreeLinks.show();
          }
        });
      }

      if(show){
        $expander.find('.visually-hidden').text(Drupal.t('Collapse folder.'));
        // If subtree was already loaded, show it
        if($subtree.length){
          toggleVisibility(true);
        }
        // Load the subtree
        else {
          $loader = $('<img class="pending" src="/sites/all/themes/schoology_theme/images/ajax-loader.gif" alt="' + Drupal.t('Loading') + '" />');
          $subtree = $('<div class="folder-subtree"></div>');
          $expander.parent().append($subtree);

          $title.after($loader);

          $.ajax({
            dataType: 'json',
            url: window.location.pathname,
            data: {
              ajax: 1,
              f: folderId
            },
            success: function(contents){
              contents = $(contents);

              // Do a little bit of cleanup
              // Since the helper function we use creates a form,
              // remove the form wrapper and other form artifacts
              $('form>div', contents).unwrap();
              $('[name=form_build_id], [name=form_token], [name=form_id]', contents).remove();
              $loader.remove();
              $subtree.hide().html(contents);
              toggleVisibility(true);
              Drupal.attachBehaviors($subtree);
              $('tr td.actions', $subtree).sActionLinks({ hidden: false, wrapper: '.action-links-wrapper' });

              var foldersActionPush = $(document).data('sCourseMaterialsFoldersActionPush');
              if(foldersActionPush && foldersActionPush.length){
                var fid = foldersActionPush.pop();
                var $expander = $('#f-' + fid + ' > td.folder-contents-cell > .folder-expander');
                if(!$expander.hasClass('expanded')){
                  $expander.click();
                }
                $(document).data('sCourseMaterialsFoldersActionPush', foldersActionPush);
              }
              else{
                refreshSortableContent($subtree);
              }
            },
            error: function(){
              $subtree.html('<div class="error">' + Drupal.t('There was an error while loading the folder content. Please reload this page and try again.') + '</div>');
              refreshSortableContent($subtree);
            }
          });
        }
      }
      else{
        $expander.find('.visually-hidden').text(Drupal.t('Expand folder.'));
        toggleVisibility(false);
      }
    }

    // Behavior for folder AJAX expanders
    $('.folder-contents-cell .folder-expander:not(.sCourseMaterialsFolders-processed)', context ).addClass('sCourseMaterialsFolders-processed').each(function(){
      var $expander = $(this);
      $expander.click(function(){
        var show = !$expander.hasClass('expanded');
        $expander.toggleClass('expanded');
        toggleSubtree($expander, show);
      });
    });
  })();

  // Keep track of actionlink clicks to re-expand the tree
  // after content refresh from popups
  // Only do this if there is a #folder-contents-table
  if($('#folder-contents-table').length){
    $('body:not(.sCourseMaterialsFolders-processed)', context).addClass('sCourseMaterialsFolders-processed').each(function(){
      $(document).bind('popups_open_path', function(event, element, href){
        var target = $(element).parents();
        // Handle the action if the popup source is action-links-wrapper or a descendant
        if(target.hasClass('action-links-wrapper') || target.closest('.action-links-wrapper').length){
          var foldersActionPush = [];

          // Start from the subtree div so it doesn't count the current folder
          target.closest('.subtree-folder-contents-table').parents('tr.material-row-folder').each(function(){
            foldersActionPush.push($(this).attr('id').split('-')[1]);
          });

          if(foldersActionPush && foldersActionPush.length){
            // Store this array in a data field rather than a global
            // variable since the AJAX success functions don't play nice
            // with global variables
            $(document).data('sCourseMaterialsFoldersActionPush', foldersActionPush);
          } else {
            $('.folder-expander.expanded').trigger('click');
          }
            
          location.hash = 'foldersexpanded=' + foldersActionPush.join(',');
        }
        if(target.closest('#course-materials-action-links-inline').length){
          var foldersActionPush = [];
          var materialsRowAddId = target.closest('#course-materials-action-links-inline').data('materialsRowAddId');
          if(materialsRowAddId){
            $('#' + materialsRowAddId).parents('tr.material-row-folder').each(function(){
              foldersActionPush.push($(this).attr('id').split('-')[1]);
            });
          }
          if(foldersActionPush.length){
            location.hash = 'foldersexpanded=' + foldersActionPush.join(',');
          }
        }
      }).bind('popups_form_success', function(event, popup, data){
        // Once the form succeeds, check to see if there are any fids
        // in the stored path - if so, ensure they're expanded
        var foldersActionPush = $(document).data('sCourseMaterialsFoldersActionPush');
        if(foldersActionPush && foldersActionPush.length){
          var fid = foldersActionPush.pop();
          var expander = $('#f-' + fid + '>td.folder-contents-cell>.folder-expander');
          if(!expander.hasClass('expanded')){
            expander.click();
          }
          $(document).data('sCourseMaterialsFoldersActionPush', foldersActionPush);

          // The AJAX behavior of the expander will continue to
          // pop the sCourseMaterialsFolderActionPath array
        }
      });
    });

    // Handle any foldersexpanded as dicated by the hash
    if(location.hash.match('foldersexpanded')){
      var foldersExpanded = location.hash.split('foldersexpanded=')[1].split(',');

      foldersExpanded.forEach(function(currentValue){
          var fid = currentValue;
          var expander = $('#f-' + fid + '>td.folder-contents-cell>.folder-expander');
          if(!expander.hasClass('expanded')){
              expander.click();
          }
      });
    }
  }

  $('#s-generic-post-new-display-view:not(.sCourseMaterialsFolders-processed),#folder-contents-table:not(.sCourseMaterialsFolders-processed)', context).addClass('sCourseMaterialsFolders-processed').each(function() {
    var table = $(this);

    if(table.attr('id') == 'folder-contents-table'){
      // Add action link behavior
	    $('tr td.actions').sActionLinks({ hidden: false, wrapper: '.action-links-wrapper' });

      var addMaterialsActionLinks = $('.materials-top .course-content-action-links .action-links');
      var inlineAddLinksWrapper = $('<div id="course-materials-action-links-inline" class="hidden"></div>');
      $('body').append(inlineAddLinksWrapper);
      var lastMaterialsRowAddTarget = null;

      table.click(function(e){
        var target = $(e.target);

        // Add materials behavior
        // Since the add materials action links are outside the table,
        // find them in the global context
        if(target.parent('.materials-row-add-line').length){
          var materialsRowAddId = target.closest('.materials-row-add').attr('id');
          var materialsRowAddIdSplit = materialsRowAddId.split('-');
          var targetFid = materialsRowAddIdSplit[3];
          var targetWeight = materialsRowAddIdSplit[4];

          // clicking on the same line should close the menu
          if(lastMaterialsRowAddTarget && materialsRowAddId == lastMaterialsRowAddTarget.closest('.materials-row-add').attr('id')){
            inlineAddLinksWrapper.hide();
            lastMaterialsRowAddTarget = null;
            return;
          }

          lastMaterialsRowAddTarget = target;

          // Make sure that the links we copy are the most up to date ones
          // that contain any dynamic changes to the original menu
          var targetOffset = target.offset();
          inlineAddLinksWrapper.empty()
            .data('materialsRowAddId', materialsRowAddId)
            .append(addMaterialsActionLinks.clone(true).show())
            .show()
            .css({
              position: 'absolute',
              top: targetOffset.top + target.height(),
              left: targetOffset.left
            });

          // Modify the links to reflect the proper folder and weight
          $('li', inlineAddLinksWrapper).each(function(){
            var actionItem = $(this);
            var actionLink = $('a', actionItem);
            var actionItemClass = actionItem.attr('class');

            //Some items, like the separator lines, don't contain links. Skip them.
            if(actionLink[0] == undefined) {
              return true;
            }

            var pathname = actionLink[0].pathname;

            // IE doesn't return a leading slash for href paths,
            // but other browsers do. For consistency, strip it
            // here and add it back below.
            pathname = pathname.replace(/^\//,'');

            var queryString = actionLink[0].search;
            if(!queryString.length){
              var qsParsed = {};
            }
            else {
              var qsParsed = getQueryParams(queryString);
            }

            switch(actionItemClass){
              case 'action-import-library':
                if(targetFid > 0){
                  qsParsed.topic_nid = targetFid;
                }
                else {
                  delete qsParsed.topic_nid;
                }
                qsParsed.fweight = targetWeight;
                actionLink.attr('href', '/' + pathname + '?' + jQuery.param(qsParsed));
                break;

              case 'action-find-resources':
                // Don't show the action-find-resources
                actionItem.remove();
                break;

              default:
                if(targetFid == 0 && !sCourseMaterialsDisplayIsWithoutIndex()){
                  // Only allow folders on top level
                  if(actionItemClass != 'action-create-folder'){
                    actionItem.remove();
                    return;
                  }
                  else {
                    actionItem.addClass('folder-no-materials');
                  }
                }

                qsParsed.f = targetFid;
                qsParsed.fweight = targetWeight;
                actionLink.attr('href', '/' + pathname + '?' + jQuery.param(qsParsed));
                break;
            }
          });
        }
      });

      // Click-out behavior
      $('body').click(function(e){
        var target = $(e.target);
        if(target.parent('.materials-row-add-line').length == 0){
          inlineAddLinksWrapper.hide();
          lastMaterialsRowAddTarget = null;
        }
      });
    }

    $('.has-view-rule:not(.completed)', table).click(function(){
    	var parent = $(this).parents('.type-document:first');
    	var nid = parent.attr('id').split('-')[1];
    	$.ajaxSecure({
    		url: '/course/materials/' + nid + '/view_completion'
    	});
    });
  });

  $('#closeable-message-s_course_find_resources:not(.sCourseMaterialsFolders-processed)', context).addClass('sCourseMaterialsFolders-processed').each(function(){
	  $(document).bind('s_common_closeable_message_closed', function(e, mesID){
		 if(mesID == 's_course_find_resources'){
			 var fakeCluetip = '<div class="fake-cluetip"><span class="arrow-top"><span>' + Drupal.t('You can find resources for your course in this menu.') + '</div>';
			 var offset = $('.course-content-action-links').offset();
			 $('body').append(fakeCluetip);
			 $('.fake-cluetip').css({'position': 'absolute' , 'left': offset.left + $('.course-content-action-links').width() , 'top': offset.top });
			 setTimeout(function(){
				 $('.fake-cluetip').remove();
			 }, 2000);
		 }
	  });
  });

  $('#s-course-materials-folder-create-form:not(.sCourseMaterialsFolders-processed)', context).addClass('sCourseMaterialsFolders-processed').each(function(){
    var form = $(this);

    var warningMsg = $('.rules-msg', form); //warning for completion rules removal if selected item has rule on it
    var startWrapper = $('.availability-start-wrapper', form);
    var addEndLink = $('.availability-add-end', form);
    var endWrapper = $('.availability-end-wrapper', form);
    var applyChildrenWrapper = $('#edit-apply-to-children-wrapper', form);

    // Add end time
    addEndLink.click(function(){
      $(this).remove();
      endWrapper.show();
      sPopupsResizeCenter()
    });

    if(typeof sCommonAdvancedOptions == 'object'){
      sCommonAdvancedOptions.registerEvent(form.attr('id'), 'custom-fields', 'sCourseMaterialsFolders', function(btnObj){
        if(btnObj.hasClass('adv-option-on')) {
          $("#folder-custom-fields-wrapper", form).show();
        }
        else {
          $("#folder-custom-fields-wrapper", form).hide();
        }
        sPopupsResizeCenter();
      });
    }

    $('#edit-availability', form).bind('change', function(){
      var val = parseInt($(this).val());

      //show/hide relevant form fields depending on the chosen folder availability settings
      switch(val){
      	//visible
        case 1:
          applyChildrenWrapper.show();
          if(warningMsg.length){
            warningMsg.hide();
          }
          break;
        //hidden
        case 2:
          applyChildrenWrapper.hide();
          if(warningMsg.length){
            warningMsg.show();
          }
          break;
        //Available after...
        case 3:
          applyChildrenWrapper.hide();
          if(warningMsg.length){
            warningMsg.show();
          }
          break;
        //Available between...
        case 4:
          applyChildrenWrapper.hide();
          if(warningMsg.length){
            warningMsg.show();
          }
          addEndLink.remove();
          endWrapper.show();

          break;
        default:
          break;
      }

      sPopupsResizeCenter()
    });

    $('#edit-availability', form).trigger('change');
  });

  $('#s-course-materials-folder-completion-form:not(.sCourseMaterialsFolders-processed)', context ).addClass('sCourseMaterialsFolders-processed').each(function(){

    var form = $(this);
	  hasDueList = new Array();

      //bind click event on the html links to the hidden ahah submitters
      $('.add-rule', form).click(function(){
          if (!$(this).hasClass('disabled')){
            $('#edit-rules-submitter', form).trigger('click');
          }
      });

      $('.auto-populate', form).click(function(){
    	 $('.ahah-populate-submitter', form).trigger('click');
      });

      //bind javascript events for the existing rule fields
      sCourseMaterialsSetupRules(form, true);
      sCourseMaterialsSetupRemove('rule-option', form);
      
      $(document).ajaxSend(function(e, xhr, settings){
        //right before ajax request is sent add class to disable button until request is complete
        if(settings.url == '/course/new_rule'){
            $('.add-rule', form).addClass('disabled');  
        } 
      })
      //if ahah fields are produced, rebind the javascript events on the ahah fields
      $(document).ajaxComplete(function(e, xhr, settings){
    	  if(settings.url == '/course/new_rule' || settings.url == '/course/remove_rule' || settings.url == '/course/populate_rule'){                  
    		  sCourseMaterialsSetupRules(form, false, (settings.url == '/course/remove_rule'));
    		  sCourseMaterialsSetupRemove('rule-option', form);

    		  //hide the "add prerequisites" link if user made all folders sequential at the root level
    		  var addRule = $('.add-rule', form);
    		  if(settings.url == '/course/populate_rule'){
    			  addRule.hide();
    		  }
    		  //reshow the "add prerequisites" link if user removes one of the populated rules
    		  else if(settings.url == '/course/remove_rule' && !addRule.is(':visible')){
    			  addRule.show();
    		  }
                  //free up button
                  $('.add-rule', form).removeClass('disabled');  
    	  }
    	  sPopupsResizeCenter();
      });
  });

}

/**
 * Setup the delete buttons next to the fields
 */
function sCourseMaterialsSetupRemove(parentClass, form){
    $('.' + parentClass + ':not(.sCourseMaterialsFolders-processed)', form).addClass('sCourseMaterialsFolders-processed').each(function(){
    	var parent = $(this);
    	$('.delete-btn', parent).click(function(){
    		var id = parent.attr('id');
    		var existing = parent.hasClass('existing') ? '1' : '0';
    		//record the rid of the deleted field and if the deleted field was na existing rule
    		$('.rule-remove-existing', form).val(existing);
    		$('.rule-remove-id', form).val(parseInt(id));
    		//trigger the deletion
    		$('.ahah-remove-rule', form).click();
    	});
    });
}

/**
 * Setup form behavior for the rule fields
 */
function sCourseMaterialsSetupRules(form, existing, ahahCallback){
	if(typeof ahahCallback == 'undefined')
		ahahCallback = false;

  if(typeof Drupal.settings.s_course == 'undefined' && typeof Drupal.settings.s_course.type_options == 'undefined')
    return;

	var typeOptions = Drupal.settings.s_course.type_options;
	var types = Drupal.settings.s_course.types;
  var maxPts = Drupal.settings.s_course.max_pts;
  var constants = Drupal.settings.s_course.constants; //the numerical constant which corresponds to the "must score at least" rule
  var dueEvents = Drupal.settings.s_course.due_events;
  var commentsDisabled = Drupal.settings.s_course.comments_disabled;
  var submitDisabled = Drupal.settings.s_course.submit_disabled;

	$('.rule-item:not(.sCourseMaterialsFolders-processed)', form).addClass('sCourseMaterialsFolders-processed').each(function(){
  	var itemField = $(this);
  	var ruleContext = itemField.parents('.rule-option:first');
  	var id = ruleContext.attr('id');
  	var firstChange = true;

  	//bind events when the object field of the rule is changed
  	itemField.change(function(e){
    	var item = itemField.val();
    	var ruleAction = $('.rule-action', ruleContext);
    	var itemType = types[item];
    	if(typeof dueEvents[item] != 'undefined' && dueEvents[item] > 0){
    		$('.has-due-event-warning', form).show();
    		hasDueList[parseInt(id)] = true;
    	}
    	else{
    		hasDueList[parseInt(id)] = undefined;
    	}

    	if(!hasDueList.join('').length){ //join the array in order to get rid of 'undefined' entries in the array so that they wouldn't be counted
    		$('.has-due-event-warning', form).hide();
    	}

    	//hide and/or show options that are allowed for the current type
    	var selected = $('option:selected', ruleAction).val();
    	ruleAction.empty();
    	$('.action-options option').each(function(){
    		var option = $(this);
    		var action = option.val();
    		//skip the comment rule if comment is disabled
    		if(action == constants.comment && commentsDisabled[item] == true){
    			return true;
    		}
    		//skip the submit/score at least rule if submit (eg. dropbox) is disabled
    		if((action == constants.submit || action == constants.score) && submitDisabled[item] == true){
    			return true;
    		}
    		if($.inArray(parseInt(action), typeOptions[itemType]) > -1){
    			var clonedOption = option.clone().appendTo(ruleAction);
    			if(clonedOption.val() == selected){
    				clonedOption.attr('selected', 'selected');
    			}
    		}
    	});

    	//reset action field to the first option
    	if((!firstChange || !existing) && !ahahCallback){
    		ruleAction.val($('option:visible:first', ruleAction).val());
    	}
    	else{
    		firstChange = false;
    	}

    	//hide the max points field
    	$('.max-pt', ruleContext).hide();
    	//change rule icon to current content type
    	$('.rule-icon', ruleContext).html(Drupal.settings.s_course.rule_icons[itemField.val()]);
    	sPopupsResizeCenter();
  	});

  	//fire event for first time display
  	itemField.change();
  });

	$('.rule-action:not(.sCourseMaterialsFolders-processed)', form).addClass('sCourseMaterialsFolders-processed').each(function(){
		var actionField = $(this);
		var ruleContext = actionField.parents('.rule-option:first');

		//bind events when the action field of the rule is changed
		actionField.change(function(){
			var item = $('.rule-item', ruleContext).val();
      	if(actionField.val() == constants.score){
      		//if the action is to "score at least" modify maxpts to correspond to the current item's max points
      		$('.max-pt-num', ruleContext).html(maxPts[item]);
      		$('.max-pt', ruleContext).show();
      	}
      	else{
      		$('.max-pt', ruleContext).hide();
      	}
      	sPopupsResizeCenter();
		});

		//fire event for first time display
		actionField.change();
	});
};Drupal.behaviors.sCourse = function(context) {
  if ($('body').hasClass('s-enable-mathml')) {
    s_renderMath();
  }

  $('.assignments-container:not(.sCourse-processed)' , context).addClass('sCourse-processed').each(function(){
    setupAssignmentPaging(this);
  });

  // Reordering for subtrees and planner view right column
  $('.subtree-folder-contents-table:not(.sCourse-processed), .planner-right-contents-table:not(.sCourse-processed), #folder-contents-table:not(.sCourse-processed)' , context ).addClass('sCourse-processed').each(function() {
    var table = $(this);
    sCourseEnableContentReorder($('>tbody', table));
  });

  $('.access-code:not(.sCourse-processed)').addClass('sCourse-processed').each(function(){
	 var acContext = this;
	 $('.access-delete', acContext).click(function(){
		var path = window.location.pathname.substring(1);
		var courseID = path.split('/')[1];
		$.ajaxSecure({
			url : '/enrollment/code/visibility/course/' + courseID + '/hide',
			dataType: 'json',
			type: 'GET',
			success: function(response, status){
				$(acContext).hide();
			}
		});
	 });
  });

  $('#course-events:not(.sCourse-processed)' , context ).addClass('sCourse-processed').each(function() {
    var courseUpcomingObj = $(this);
    var path = window.location.pathname.substring(1);
    var courseID = path.split('/')[1];
    $.ajax({
      // pass the current path so that the calendar nav uses the right link (the current page)
      // and also be sure to pass any ?mini arguments for changing the date in the cal
      url: '/course/' + courseID + '/calendar_ajax' + (window.location.search.length ? window.location.search + "&" : '?') + 'original_q=' + path,
      dataType: 'json',
      type: 'GET',
      success: function(response, status){
        $('.more-loading', courseUpcomingObj).remove();
        courseUpcomingObj.append($(response).children());
        if (window.location.search.match('mini=')) {
          $('#event-calendar', selector).click();
        }
        // ie 8 is complaining about too much js on the course materials page, skip using attachBehaviors here
        // to cut down on executed javascript on this page
        sAttachBehavior( 'sCourse' , courseUpcomingObj );
        sAttachBehavior( 'sCommonInfotip' , courseUpcomingObj );
        courseUpcomingObj.show();
      }
    });

    var selector = $('h3#event-selector', courseUpcomingObj );

    $('#event-calendar', selector).click(function(){
        var popup = new Popups.Popup();
        var body = '<div id="fcalendar" style="width: 800px;"></div>';
        var buttons = {
            'popup_cancel': {title: Drupal.t('Close'), func: function(){popup.close();}}
        }

        popup.extraClass = 'popups-extra-large calendar-popup-mini';
        var activePopup = popup.open(Drupal.t('Calendar'), body, buttons);
        Drupal.attachBehaviors( $('#' + String(activePopup.id)+ '') );
        Drupal.behaviors.sCommonMediaFileIframeUseRelativeUrl($('#' + String(activePopup.id)+ ''));
        $("#share-calendar-option-containter .share-calendar-option").insertAfter("#fcalendar");
        sPopupsResizeCenter();
    });

  });

  $('div#course-profile-selector:not(.sCourse-processed)', context).addClass('sCourse-processed').each(function() {
    var selectorWrapper = $(this);
    $('li', selectorWrapper).click(function() {
      var selector = $(this);
      if (selector.attr('id') == 'selector-materials') {
        $("#course-profile-materials").show();
        $("#course-profile-updates").hide();
      }
      if (selector.attr('id') == 'selector-updates') {
        $("#course-profile-updates").show();
        $("#course-profile-materials").hide();
      }
      $('li.active', selectorWrapper).removeClass('active');
      selector.addClass('active');
    });
  });

  $('div#important-post:not(.sCourse-processed)', context).addClass('sCourse-processed').each(function() {
    var importantPostContainer = $(this);
    $("a.important-remove-hidden", importantPostContainer).bind("click", function() {
      $(this).parent().parent().find("form").submit();
      return false;
    });
  });


  $('.course-info-wrapper:not(.sCourse-processed)', context).addClass('sCourse-processed').each(function() {
    var wrapper = $(this);
    var moreInfo = $('.course-info-full', wrapper);
    var lessInfo = $('.course-info-less', wrapper);
    $('.more-link', wrapper).click(function() {
      lessInfo.hide();
      moreInfo.show();
    });
    $('.less-link', wrapper).click(function() {
      lessInfo.show();
      moreInfo.hide();
    });

  });

  $('.notification-settings:not(.sCourse-processed)', context).addClass('sCourse-processed').each(function(){
	  sUserSetupRealmNotifButton($(this));
  });

  $('.profile-picture-wrapper:not(.sCourse-processed)', context).addClass('sCourse-processed').each(function(){
    var wrapper = $(this);
    var link = $('.edit-profile-picture-hover', wrapper);
    var pic = $('.profile-picture', wrapper);
    var uploader = $('#profile-picture-uploader-wrapper', wrapper);

    link.bind('click', function(){
      if(uploader.is(':visible')){
        uploader.hide();
      }
      else {
        uploader.show();
      }
    });

    $('body').bind('click', function(e){
      var target = $(e.target);
      if(!target.hasClass('profile-picture-wrapper') && target.parents('.profile-picture-wrapper').length == 0){
        uploader.hide();
      }
    });

    pic.bind('s_profile_picture_uploaded', function(e, path){
    	$('img', $(this)).attr('src', path).removeAttr('height');
      uploader.hide();
    });
  });

  $('li.assignment .action-links-wrapper:not(.sCourse-processed)', context).addClass('sCourse-processed').each(function() {
    $(this).sActionLinks( {
      hidden : false,
      wrapper : '.action-links-wrapper'
    });
  });

  $('#link-sections-wrapper:not(.sCourse-processed)', context).addClass('sCourse-processed').each(function() {
    $(this).sActionLinks({hidden : false, wrapper : '#link-sections-wrapper'});
  });

  $('#s-course-settings:not(.sCourse-processed)', context).addClass('sCourse-processed').each(function() {
    $(this).sActionLinks( {
      hidden : false,
      wrapper : '.action-links-wrapper'
    });
  });

  // Materials index toolbar (add materials, options)
  $('#course-profile-materials .materials-top:not(.sCourse-processed)', context).addClass('sCourse-processed').each(function(){
    var wrapperObj = $(this);

    // Options -> Print behavior
    $('#print-view', wrapperObj).bind('click', function(){
      // Add a body class and a button to return to previous view
      $('body').addClass('print-view');
      var returnBtn = $('<div id="print-return"><span>' + Drupal.t('Return to previous page') + '</span></div>');
      returnBtn.click(function(){ location.reload(); });
      $('body').prepend(returnBtn);
      $('#course-profile-materials .ui-sortable').sortable('destroy')
      window.print();
    });

    $('#toolbar-options-wrapper', wrapperObj).addClass('sCourse-processed').each(function() {
      $(this).sActionLinks({hidden : false, wrapper : '#toolbar-options-wrapper'});
    });

    $('.course-content-action-links', wrapperObj).each(function() {
      // initialze add materials drop down menu
      $(this).sActionLinks( {
        hidden : false,
        wrapper : '.action-links-wrapper'
      });

      // register click handler for app canvas pop
      $('.action-links.has-material-apps', this).on('click', '.action-lti-app', function (e) {
        e.preventDefault();
        // @see s_tinymce_resources_insert_app_popup()
        var url = '/tinymceinsertresourcesapp?r=' + String( $(this).data('realm') ) +
                                            '&id='+String( $(this).data('realm_id') ) +
                                            '&a='+String( $(this).data('app_nid') ) +
                                            '&context=materials';
        /*
           we need to extract folder_id and inline weight from url since this information is dynamically
           updated for the inline course materials add popup menu
         */
        var qParams = getQueryParams($('a', this).prop('href'));
        if(qParams && typeof qParams.f != 'undefined') {
          url += '&f=' + String(qParams.f);
        }

        if(qParams && typeof qParams.fweight != 'undefined') {
          url += '&fweight=' + String(qParams.fweight);
        }

        Popups.saveSettings();
        // The parent of the new popup is the currently active popup.
        var parentPopup = Popups.activePopup();
        var popupOptions = Popups.options({
          ajaxForm: false,
          extraClass: 'popups-extra-large popups-insert-library',
          updateMethod: 'none',
          href: url,
          hijackDestination: false,
          disableCursorMod: true,
          disableAttachBehaviors: false
        });
        // Launch the cookie preload popup first, then launch app
        var cookiePreloadUrl = sCommonGetSetting('s_app', 'cookie_preload_urls', $(this).data('app_nid'));
        if(cookiePreloadUrl) {
          sAppMenuCookiePreloadRun($(this).data('app_nid'), cookiePreloadUrl, function(){
            // clear cached launch data since we store cookie preload attempts in session
            sAppLauncherClearCache($(this).data('app_nid'));
            sAppMenuCookiePreloadDelete($(this).data('app_nid'));
            Popups.openPath(this, popupOptions, parentPopup);
          });
        }
        // launch app popup
        else {
          Popups.openPath(this, popupOptions, parentPopup);
        }
      });
    });
  });

  $('.past-assignments-grading-period .clickable:not(.sCourse-processed)', context).addClass('sCourse-processed').each(function() {
    $(this).click(function() {
      var periodAssignments = $('>ul', $(this).parent());
      if (periodAssignments.css('display') == 'none') {
        $(this).parent().removeClass('assignments-hidden');
        periodAssignments.show();
      }
      else {
        $(this).parent().addClass('assignments-hidden');
        periodAssignments.hide();
      }
    });
  });

  $('.s-course-editor-wrapper .save-and-continue-btn:not(.sCourse-processed)',context).addClass('sCourse-processed').bind('click', function() {
    var wrapper = $(this).parents('.s-course-editor-wrapper');
    var form = wrapper.find('form');
    form.submit();
    return false;
  });

  // materials shortcut
  $('#menu-s-main a.course-materials-left-menu:not(.sCourse-processed)', context).addClass('sCourse-processed').each(function() {
    var menuLink = $(this),
        menuLinkArrow = $('.materials-dropdown-arrow', menuLink),
        menuDropdown = $("#course-materials-dropdown"),
        menuDropdownHasContent = menuDropdown.find('.item-list ul').length > 0;
    menuLink.after(menuDropdown);

    // check if the associated menu dropdown has content before showing the menu link arrow
    // the arrow is rendered in a title callback so it doesn't have any knowledge of whether there should be content or
    // not in the backend
    if(menuDropdownHasContent){
      menuLinkArrow.removeClass('hidden').click(function() {
        var arrow = $(this);
        var hidden = menuDropdown.is(':hidden');
        if (hidden) {
          $('body').bind('click.sCourseMaterialsHandle',function(e) {
            var target = $(e.target);
            var hidden = menuDropdown.is(':hidden');
            if (!hidden && target != menuDropdown && target.parents('#course-materials-dropdown').length == 0) {
              $('.materials-dropdown-arrow', menuLink).click();
            }
          });

          menuDropdown.show()
          $(this).addClass('active');
        }
        else {
          menuDropdown.hide();
          $(this).removeClass('active');
          $('body').unbind('click.sCourseMaterialsHandle');
        }
        return false;
      });
    }
    else{
      menuLinkArrow.hide();
    }
  });

  $('#right-column .reminders-wrapper:not(.sCourse-processed)', context ).addClass('sCourse-processed').each(function(){
	  sCourseSetupTodoList( $(this) );
  });

  /**
  * TRACK ANY COURSE SPECIFIC GENERIC POST VIEWS. THIS BEHAVIOR ONLY NEEDS TO BE ATTACHED
  * ONCE SO PUT IT OUTSIDE OF DRUPAL.ATTACHBEHAVIORS()
  */

  if(!$('body').hasClass('anonymous')){
    $('.gen-post-link:not(.sCourse-processed)', context ).addClass('sCourse-processed').each(function(){
      var getPostLink = $(this);
      getPostLink.on('click', function(e){
        if(!getPostLink.hasClass('embed-cover') && !genPostLink.hasClass('media-player-popup')){
          e.preventDefault();
        }
        sCourseTrackGenericPostView($(this));
      });
    });
  }

  // associated with theme('s_course_area_switcher')
  $('.s-js-course-area-switcher .action-links-wrapper:not(.sCourse-processed)', context).addClass('sCourse-processed').each(function(){
    $(this).sActionLinks({hidden: false ,wrapper: '.badge-action-links'});
  });

  /**
   * This block processes the handling of materials filter views.
   *
   * Behaviors include:
   *   Handle updating of the content body when filters are changed and AJAX'ed in
   *   Handle the binding of popups behaviors on gear/action links menus
   *   Handle the "more link" and its infinite scrolling behavior for pagination
   *
   * @param object context
   */
  (function(context){
    // this is the main body of the full view of the course materials listing
    $('.s-js-course-materials-full:not(.sCourse-processed)', context).addClass('sCourse-processed').each(function(){
      var wrapperObj = $(this),
          actionLinksWrapper = wrapperObj.find('.s-js-materials-filter-wrapper .action-links-wrapper'),
          actionLinksLabel = actionLinksWrapper.find('.action-links-unfold-text'),
          optionsMenu = wrapperObj.find('.s-js-options-action-links-outer'),
          selectedFilterItem = null;

      /**
       * Update the option menu based on the provided current
       * Show only the option specified by the filter argument
       *
       * @param string filter
       */
      function updateOptionMenu(filter){
        optionsMenu.find('.s-js-content-option').hide().addClass('content-option--hidden');
        optionsMenu.find('.s-js-content-option-' + filter).show().removeClass('content-option--hidden');

        if (optionsMenu.find('li:not(.content-option--hidden)').length) {
          optionsMenu.show();
        } else {
          optionsMenu.hide();
        }
      }

      /**
       * Change the selected filter to provided filter.
       * This only updates the UI of the actual filter controls and not the content of the page.
       *
       * @param string filter
       */
      function changeSelectedFilter(filter){
        selectedFilterItem = actionLinksWrapper.find('.s-js-material-filter-' + filter.replace(/_/g, '-'));
        var currentFilter = actionLinksWrapper.data('filter'),
            newFilter = selectedFilterItem.data('filter');

        if(currentFilter != newFilter){
          actionLinksWrapper.data('filter', newFilter);
          actionLinksWrapper.find('.selected').removeClass('selected');
          selectedFilterItem.closest('li').addClass('selected');
          actionLinksLabel.text(selectedFilterItem.text());
        }
      }

      /**
       * Refresh the content of the current filter stored in currentFilterInfo.
       *
       * Events called:
       * sCourseMaterialsFilterChanged({filter: newFilter, url: newUrl})
       *   called when a different filter is selected and page content should be updated
       */
      function refreshContent(){
        if(selectedFilterItem && selectedFilterItem.length){
          var filter = getHashFilter(),
              oldFilter = selectedFilterItem.data('filter');
          if(filter != oldFilter){
            changeSelectedFilter(filter);
          }
          sAngular.trigger('sCourseMaterialsFilterChanged', {
            filter: selectedFilterItem.data('filter'),
            url: selectedFilterItem.attr('href')
          });
        }
      }

      /**
       * Fetch the content from the url of the provided filter
       *
       * Events called:
       * sCourseMaterialsFilterContentRefreshed(filter)
       *
       * @param string url
       * @param string filter
       */
      function getContent(url, filter){
        var activeLoaderKey = 's-js-course-materials-full';

        url += (url.indexOf('?') ? '&' : '?') + 'ajax=1&style=full';
        sToggleActiveLoader(activeLoaderKey, wrapperObj);
        $.ajax({
          url: url,
          success: function(data){
            var contentObj = $(data),
                currentMaterialsBody = wrapperObj.find('.s-js-materials-body'),
                newMaterialsBody = contentObj.find('.s-js-materials-body');
            if(currentMaterialsBody.length){
              currentMaterialsBody.replaceWith(newMaterialsBody);
            }
            else{
              wrapperObj.append(newMaterialsBody);
            }

            Drupal.attachBehaviors(wrapperObj.find('.s-js-materials-body'));

            sAngular.trigger('sCourseMaterialsFilterContentRefreshed', filter);
          },
          complete: function(){
            sToggleActiveLoader(activeLoaderKey);
          }
        });
      }

      /**
       * Parse the filter from the current hash state
       *
       * @return string
       */
      function getHashFilter(){
        var filter = 'all',
            matches = /filter_type=(\w+)/.exec(window.location.hash);
        if(matches){
          filter = matches[1];
        }
        return filter;
      }

      /**
       * Update the current hash state to the provided filter
       *
       * @param string filter
       */
      function setHashFilter(filter){
        window.location.hash = '!filter_type=' + filter;
      }

      $(window).on('hashchange', function(e){
        refreshContent();
      });

      // listen for the sCourseMaterialsFilterChanged event (called when filter change and new content should be loaded)
      // and update the contents of the view based on the filter selected.
      sAngular.on('sCourseMaterialsFilterChanged', function(data){
        var filter = data.filter,
            url = data.url;

        getContent(url, filter);
      });

      // keep track of which filters have already bound the popups configs so it doesn't get called again
      var popupsConfigBound = {};

      // these options are common to all of the above popup options
      var defaultPopupsOpts = {
        updateMethod: 'callback',
        onUpdate: function(data, popupOptions, popupElement){
          // on updating, cause the content of the materials to refresh instead of the entire page for a better experience
          refreshContent();
          Popups.close();
          return false;
        }
      };

      // these popups config are used in many of the material type filters
      var commonPopupsConf = {
        '.materials-item-actions .action-publish a': {extraClass: 'popups-small popups-publish'},
        '.materials-item-actions .action-unpublish a': {extraClass: 'popups-small popups-unpublish'},
        '.materials-item-actions .action-delete a': {extraClass: 'popups-small popups-action-item'},
        '.materials-item-actions .action-move a': {extraClass: 'popups-small popups-action-item'},
        '.materials-item-actions .action-copy a': {extraClass: 'popups-large popups-copy popups-action-item'},
        '.materials-item-actions .action-distribute a': {extraClass: 'popups-large popups-copy popups-action-item'},
        '.materials-item-actions .action-library-save a': {extraClass: 'popups-large'},
        '.materials-item-actions .action-edit-properties a': {extraClass: 'popups-large'},
        '.materials-item-actions .s-js-locked-resource-link-diff': {extraClass: 'popups-extra-large linked-content-diff-view'},
        '.materials-item-actions .s-js-unlink-node': {extraClass: 'popups-small unlink-popup'},
        '.materials-item-actions .action-edit-link a': {extraClass: 'popups-large popups-action-item popups-add-link'}
      };

      // For CSM Common Assessment materials (only) we want to show an extra large popup
      var isCSM = !!sCommonGetSetting('s_realm_info', 'csm_realm_id');
      if (isCSM) {

        // SGY-22549
        // We want to conditionally show a larger popup for Managed Assessments edit
        // For Non-MA we need direct child ops '>' in order to prevent both selectors from being applied to the case where a MA is in a folder
        //   (because the folder also has a .dr element)
        commonPopupsConf['.dr:not(.type-common-assessment) > * > .materials-item-actions .action-edit a'] = {extraClass: 'popups-large popups-action-item'};
        commonPopupsConf['.type-common-assessment .materials-item-actions .action-edit a'] = {extraClass: 'popups-extra-large popups-action-item'};
      } else {
        commonPopupsConf['.materials-item-actions .action-edit a'] = {extraClass: 'popups-large popups-action-item'};
      }

      // these popups config are folder-specific, and should only be used when folders are available
      var folderPopupsConf = {
        '.materials-folder-actions .action-edit a': {
          extraClass: 'popups-large popups-action-item',
          targetSelectors: ['#s-course-materials-folder-contents-form']
        },
        '.materials-folder-actions .action-publish a': {
          extraClass: 'popups-small popups-action-item',
          targetSelectors: ['#s-course-materials-folder-contents-form']
        },
        '.materials-folder-actions .action-unpublish a': {
          extraClass: 'popups-small popups-action-item',
          targetSelectors: ['#s-course-materials-folder-contents-form']
        },
        '.materials-folder-actions .action-delete a': {
          extraClass: 'popups-small popups-action-item',
          updateMethod: 'reload'
        },
        '.materials-folder-actions .action-copy a': {
          extraClass: 'popups-large popups-action-item popups-copy',
          disableInputFocus: true,
          doneTest: 'course/.+?/materials($|[^\/].*)',
          updateMethod: 'reload'
        },
        '.materials-folder-actions .action-distribute a': {
          extraClass: 'popups-large popups-copy popups-action-item'
        },
        '.materials-folder-actions .action-move a': {
          extraClass: 'popups-small popups-action-item',
          targetSelectors: ['#course-profile-materials-folders'],
          updateMethod: 'reload',
          doneTest: '.+'
        },
        '.materials-folder-actions .action-library-save a': {
          extraClass: 'popups-large popups-action-item',
          hijackDestination: true,
          updateSource: 'final',
          doneTest: 'course/.+?/materials.*',
          updateMethod: 'reload',
        },
        '.materials-folder-actions .action-completion a': {
          extraClass: 'popups-large popups-action-item student-completion-popup'
        }
      };

      // called when new content is loaded based on a filter change
      // bind popup events to the provided context
      // since the wrapperObj never gets removed from the DOM, the event is bound once per filter type and delegated from it
      sAngular.on('sCourseMaterialsFilterContentRefreshed', function(filter){
        updateOptionMenu(filter);

        if(typeof popupsConfigBound[filter] == 'undefined'){
          popupsConfigBound[filter] = null;

          var popupsConf = {};

          switch(filter){
            case 'all':
              popupsConf = $.extend({}, folderPopupsConf, commonPopupsConf, {
                '.materials-item-actions .action-convert a': {extraClass: 'popups-small'},
                '.materials-item-actions .action-edit-xlarge a': {extraClass: 'popups-extra-large popups-action-item'},
                '.materials-item-actions .action-rename a': {extraClass: 'popups-small popups-action-item'},
                '.materials-item-actions .action-remove a': {extraClass: 'popups-small popups-action-item'},
                '.materials-item-actions .action-package-delete a': {extraClass: 'popups-small popups-package-delete'},
                '.materials-item-actions .action-edit-package-props a': {extraClass: 'popups-extra-large popups-package-edit-props'},
                '.materials-item-actions .action-edit-launch-props a': {extraClass: 'popups-small popups-package-edit-launch-props'},
                '.materials-item-actions .action-view-progress a': {extraClass: 'popups-extra-large popups-package-progress'},
                '.materials-item-actions .action-copy a': {
                  extraClass: 'popups-large popups-action-item popups-copy',
                  disableInputFocus: true,
                  doneTest: 'course/.+?/materials($|[^\/].*)',
                  updateMethod: 'reload',
                },
                '.materials-item-actions .action-move a': {
                  extraClass: 'popups-small popups-action-item',
                  targetSelectors: ['#course-profile-materials-folders'],
                  updateMethod: 'reload',
                  doneTest: '.+'
                },
                '.materials-item-actions .action-library-save a': {
                  extraClass: 'popups-large popups-action-item',
                  hijackDestination: true,
                  updateSource: 'final',
                  doneTest: 'course/.+?/materials.*',
                  updateMethod: 'reload',
                }
              });
              break;

            case 'assessments':
            case 'assignments':
            case 'discussion':
              popupsConf = $.extend({}, commonPopupsConf, {
                '.view-ind-assign': {extraClass: 'popups-small', 'disableInputFocus': true}
              });
              break;

            case 'scorm':
              popupsConf = $.extend({}, commonPopupsConf, {
                '.materials-item-actions .action-edit-package-props a': {extraClass: 'popups-extra-large popups-package-edit-props'},
                '.materials-item-actions .action-edit-launch-props a': {extraClass: 'popups-small popups-package-edit-launch-props'},
                '.materials-item-actions .action-view-progress a': {extraClass: 'popups-extra-large popups-package-progress'}
              });
              break;

            case 'web':
            case 'album':
              popupsConf = $.extend({}, commonPopupsConf);
              break;

            case 'pages':
              popupsConf = $.extend({}, commonPopupsConf, {
                '.materials-item-actions .action-edit-xlarge a': {extraClass: 'popups-extra-large'},
                '.materials-item-actions .action-add-to-folder a': {extraClass: 'popups-small'}
              });
              break;

            case 'documents_files':
            case 'documents_links':
            case 'documents_external_tools':
              popupsConf = $.extend({}, commonPopupsConf, {
                '.materials-item-actions .action-rename a': {extraClass: 'popups-small popups-action-item'},
                '.materials-item-actions .action-copy a': {
                  extraClass: 'popups-large popups-action-item popups-copy',
                  doneTest: 'course/.+?/materials($|[^\/].*)'
                }
              });
              break;
            case 'common_assessments':
            case 'new_test_quiz':
              popupsConf = $.extend({}, commonPopupsConf, {
                '.materials-item-actions .action-edit a': {hidden: false, extraClass: 'popups-large popups-action-item', wrapper: '.action-links-wrapper'},
                '.materials-item-actions .action-publish a': {hidden: false, extraClass: 'popups-small popups-publish',  wrapper: '.action-links-wrapper'},
                '.materials-item-actions .action-move a': {hidden: false, extraClass: 'popups-small popups-action-item', wrapper: '.action-links-wrapper'},
              });
              break;
          }

          if(!$.isEmptyObject(popupsConf)){
            var selectorPrefix = filter == 'all' ? '.s-js-full-view' : '.s-js-filtered-view-' + filter.replace(/_/g, '-'),
                globalConfig = sCommonGetSetting('popups', 'links') || {};
            $.each(popupsConf, function(selector, opts){
              // don't bind anything that is already bound in the global configuration
              if(typeof globalConfig[selector] == 'undefined'){
                opts = $.extend({}, defaultPopupsOpts, opts);
                wrapperObj.on('click', selectorPrefix + ' ' + selector, opts, function(e){
                  e.preventDefault();
                  return Popups.clickPopupElement(this, Popups.options(e.data));
                });
              }
            });
          }
        }
      });

      // the switcher that allows the user to access the filtered materials list
      // associated with theme('s_course_materials_list_view_switcher')
      actionLinksWrapper.sActionLinks({
        hidden: false
      });

      actionLinksWrapper.on('click', '.s-js-material-filter-link', function(e){
        e.preventDefault();
        var filter = $(this).data('filter');
        sStatsRecordEvent('course:materials:filter_clicked:' + filter);
        changeSelectedFilter(filter);
        setHashFilter(filter);
      });

      var initiallySelected = actionLinksWrapper.find('.selected'),
          hashFilter = getHashFilter();
      if(hashFilter != 'all'){
        // page opened with a hash string of list_filter=[filter]
        changeSelectedFilter(hashFilter);
        refreshContent();
      }
      else if(initiallySelected.length){
        // page opened with a query string of list_filter=[filter]
        var initialFilter = initiallySelected.find('.s-js-material-filter-link').data('filter');
        changeSelectedFilter(initialFilter);
        sAngular.trigger('sCourseMaterialsFilterContentRefreshed', initialFilter);
      } else {
	      sAngular.trigger('sCourseMaterialsFilterContentRefreshed', 'all');
      }
    });

    // these more links appear in the filtered views, which will cause infinite scrolling to occur
    $('.s-js-materials-filter-more-link:not(.sCourse-processed)', context).addClass('sCourse-processed').each(function(){
      var linkObj = $(this),
          loadMoreKey = 's-js-materials-filter-more';
      linkObj.sInfiniteScroll({
        loadMore: function(){
          linkObj.trigger('click');
        }
      }).on('click', function(e){
        e.preventDefault();
        var url = linkObj.attr('href'),
            wrapperObj = linkObj.closest('.s-js-course-materials-full'),
            currentMaterialsBody = wrapperObj.find('.s-js-materials-body');
        sToggleActiveLoader(loadMoreKey, linkObj);
        $.ajax({
          url: url,
          success: function(data){
            var newContentObj = $(data),
                newFilteredList = newContentObj.find('.s-js-filtered-view-list'),
                newMoreLink = newContentObj.find('.s-js-materials-filter-more-link');
            if(newFilteredList.length){
              currentMaterialsBody.find('.s-js-filtered-view-list').append(newFilteredList.children());
            }
            if(newMoreLink.length){
              currentMaterialsBody.append(newMoreLink);
            }
            // wait for the content to be in the DOM before attaching behaviors
            Drupal.attachBehaviors(currentMaterialsBody);
          },
          complete: function(){
            sToggleActiveLoader(loadMoreKey);
            linkObj.remove();
          }
        });
      });
    });

    // these are gear icons found in all of the materials filtered views
    $('.s-js-materials-filtered-actions:not(.sCourse-processed)', context).addClass('sCourse-processed').each(function(){
      $(this).find('.action-links-wrapper').sActionLinks({
        hidden: false
      });
    });
  }(context));
}

function sCourseEnableContentReorder(tbodyElement) {
  var allowRootLevelItems = sCourseMaterialsDisplayIsWithoutIndex();

  // Only enable sorting if the passed element is a decendant
  // of #course-profile-materials.materials-admin-view
  if(!tbodyElement.closest('#course-profile-materials').hasClass('materials-admin-view')){
    return;
  }

  // In the planner view, the left and right sortables shouldn't be connected
  var plannerView = $('#course-profile-materials-folders').hasClass('planner-view');
  if(plannerView){
    // Left column
    if(tbodyElement.parent().attr('id') == 'folder-contents-table'){
      var connectWith = false;
    }
    // Right column
    else {
      var connectWith = '.subtree-folder-contents-table>tbody, .planner-right-contents-table>tbody';
    }
  }
  // By default, connect all possible sortables
  else {
    var connectWith = '#folder-contents-table>tbody, .subtree-folder-contents-table>tbody, .planner-right-contents-table>tbody';
  }

  tbodyElement.sortable( {
    forcePointerForContainers: true, // use the mouse cursor to determine whether we've travelled between containers
    items: '> tr:not(.materials-row-add)',
    handle: '.folder-title, .item-title, .document-body-title, .item-icon, .inline-icon',
    connectWith: connectWith,
    cancel: '.materials-row-add, .type-empty',
    delay: 500,
    helper : function(e, currentItem) {
      var helper = currentItem.clone(),
          subtree = currentItem.find('.folder-subtree');
      helper.find('.folder-subtree').hide();
      helper.find('.s-js-folder-description').hide();

      // if a subtree exists, remove it's height from the floating helper
      // this is so intersection-calculations will not take into account the potentially giant empty space below the item title
      // for more information, see the use of this.helperProportions in _intersectsWith() of the jquery.ui.sortable plugin
      if(subtree.length){
        helper.height(currentItem.height() - subtree.height());
      }
      return helper;
    },
    placeholder: 'reorder-target-placeholder',
    opacity: 0.5,
    expandDelay: 500,
    expand: function(e, target){
      var expander = $('.folder-expander', target);
      if(expander.length && !expander.hasClass('expanded')){
        expander.click();
      }
    },
    start : function (e, ui){
      // stop the queued saving process
      sCourseSaveContentTableWeightsTimeout && clearTimeout(sCourseSaveContentTableWeightsTimeout);

      $('#folder-contents-table').addClass('sorting');

      // When moving starts, store the associated 'add materials' row
      // along with the row being moved
      var addRow = ui.placeholder.next('.materials-row-add');
      if(addRow.length){
        ui.item.data('sCourseReorderRowAdd', addRow);
      }
    },
    stop : function(e, ui) {
      $('#folder-contents-table').removeClass('sorting');

      var droppedRow = ui.item;
      var targetSortable = ui.item.parent();

      // Move the 'add materials' row to the new position
      var addRow = ui.item.data('sCourseReorderRowAdd');
      if(addRow){
        // Since the placeholder can end up before or after
        // an 'add materials' row, decide where to drop the new one
        if(ui.item.next('.materials-row-add').length){
          ui.item.before(addRow);
        }
        else {
          ui.item.after(addRow);
        }
        ui.item.removeData('sCourseReorderRowAdd');
      }

      // reweight all rows in the table
      var currentWeight = 0;
      var queryParsed = getQueryParams(window.location.search);
      var currentFid = queryParsed.f || 0;
      var parentFolderRow = ui.item.parent().closest('.material-row-folder');
      if(parentFolderRow.length){
        currentFid = parentFolderRow.attr('id').split('-')[1];
      }
      targetSortable.children().each(function(){
        var row = $(this);
        // Add materials rows
        if(row.hasClass('materials-row-add')){
          var rowId = row.attr('id').split('-');
          rowId[3] = currentFid;
          rowId[4] = currentWeight;
          row.attr('id', rowId.join('-'));
        }
        // Item/Folder rows
        else {
          row.attr('display_weight', currentWeight);

          // Increment the weight for the next pair of rows
          currentWeight++;
        }
      });

      // Mark the table as having been updated
      sCourseSaveContentTableWeights(targetSortable, droppedRow);

    },
    change: function (e, ui){
      if(!allowRootLevelItems){
        // Don't allow non-folders to be dropped on the top level
        // Hide the placeholder if this is the case
        var queryParsed = getQueryParams(window.location.search);
        var topParentFid = queryParsed.f || 0;
        if(topParentFid == 0 && !ui.item.hasClass('material-row-folder') && $(ui.placeholder).closest('table').attr('id') == 'folder-contents-table'){
          $(ui.placeholder).hide();
        }
        else {
          $(ui.placeholder).show();
        }
      }
    },
    receive: function (e, ui){
      // Don't allow non-folders to be dropped on the top level
      if($(this).parent().attr('id') == 'folder-contents-table'){
        if(!allowRootLevelItems){
          var queryParsed = getQueryParams(window.location.search);
          var topParentFid = queryParsed.f || 0;
          if(topParentFid == 0 && !ui.item.hasClass('material-row-folder')){
            ui.sender.sortable('cancel');
          }
        }
      }
      // Remove metadata if dropping into a subtree
      else {
        ui.item.find('.folder-alignment-wrapper').remove();
        ui.item.find('.folder-visibility').remove();

      }

      // Hide the 'empty' placeholder of the target
      // and show the 'empty' placeholder of the source if applicable
      var targetSortable = ui.item.parent();
      $('>.type-empty', targetSortable).hide();
      if(ui.sender && ui.sender.children().not('.materials-row-add').not('.type-empty').length == 0){
        $('>.type-empty', ui.sender).show();
      }
    },
  });
}

function sCourseMaterialsDetermineDestination(data, options, element) {
  // if no materials at all and a new one is added, redirect to the appropriate
  // path
  if (location.pathname != Drupal.settings.basePath + data.path)
    location.reload();
}

// Redirect the user to the editor for the newly created topic
// Can't do this the traditional way because of menu_set_active_item
function sCourseTopicGotoEditor(data, options, element) {
  location.href = Drupal.settings.basePath + data.js.setting.popups.originalPath;
  return false;
}

function setupAssignmentPaging(context){
  $('.gitem-pager').each(function(){
    var parent = $(this);
    var path = window.location.pathname.substring(1);
    var courseID = path.split('/')[1];
    $('a', this).unbind('click').click(function(e){
      e.preventDefault();
      periodID = parent.attr('id');
      var page = $(this).attr('href').split('page=');
      page = page[1];
      var count = $('.pager-count', parent).val();
      gradeItemType = parent.hasClass('assessment') ? 'assessment' : 'grade-item';
      parent.hide();
      parent.after('<img src="/sites/all/themes/schoology_theme/images/ajax-loader.gif" class="loader" alt="' + Drupal.t('Loading') + '" />');
      var baseURL = '/course/' + courseID + '/assignment_page/' + periodID + '/' + gradeItemType;
      if(parent.parents('.past-assignments-grading-period').length > 0){
        baseURL += '/past';
      }
      $.ajax({
          url: baseURL + '?page=' + page + '&count=' + count,
          dataType: 'json',
          type: 'GET',
          success: function(response, status){
            var liContext = parent.parents('li:first');
            $('ul:first', liContext).empty();
              var responseHtml = $(response.html);
            $('ul:first', liContext).append(responseHtml);
            parent.siblings('.loader').remove();
            parent.replaceWith(response.pager);
            setTimeout(function(){ setupAssignmentPaging(context); }, 500);
            Drupal.attachBehaviors(document);
          }
      });
    });
  });

}

/**
 * It is important, especially in the course context to track viewing on inline content like embeds - this function simply fires off a request to do so
 */
function sCourseTrackGenericPostView(link){
  var nid = link.attr('id').split('-').pop();
  var realmId = sCommonGetSetting('s_realm_info', 'csm_realm_id');
  if(!realmId){
    realmId = Drupal.settings.s_realm_info.realm_id;
  }
  var action = '/' + Drupal.settings.s_realm_info.realm + '/' + realmId  + '/materials/document/' + nid;
  var ajaxOpts = {
    url : '/stats/manual-tracker/trackPageView',
    type : 'POST',
    data : {'action_url' : action}
  };
  if(!link.hasClass('embed-cover')){
    ajaxOpts.success = function(){
      location.href = link.attr('href');
    };
  }
  $.ajaxSecure(ajaxOpts);
}

var sCourseSaveContentTableWeightsTimeout = null;
function sCourseSaveContentTableWeights(tbodyElement, rowElement){
  // Mark the element as having been updated
  rowElement.addClass('ui-sortable-item-changed');
  tbodyElement.addClass('ui-sortable-changed');

  // Fire off the saving functionality 5 seconds after the last reorder
  sCourseSaveContentTableWeightsTimeout && clearTimeout(sCourseSaveContentTableWeightsTimeout);
  sCourseSaveContentTableWeightsTimeout = setTimeout(sCourseSaveContentTableWeightsTimeoutHelper, 2000);

  var pageTitle = $('#center-top h2.page-title');
  if(!$('#folder-reorder-save-loader').length){
    $('body').append('<div id="folder-reorder-save-loader"><span>' + Drupal.t('Saving...') + '</span></div>');
  }
}

function sCourseSaveContentTableWeightsTimeoutHelper(){
  // Get all affected tables
  var droppedRow = $('#course-profile-materials .ui-sortable.ui-sortable-changed .ui-sortable-item-changed').removeClass('ui-sortable-item-changed');
  var toSave = $('#course-profile-materials .ui-sortable.ui-sortable-changed').removeClass('ui-sortable-changed');

  // get the dropped row containing an item
  var droppedRowId = droppedRow.attr('id');
  var droppedItemId = droppedRowId.search(/^n-[\d]+$/) === 0 ? droppedRowId : '';

  // If for some reason we get here and nothing has changed, don't do anything
  if(!toSave.length){
    return;
  }

  // Get top level parent folder
  var queryParsed = getQueryParams(window.location.search);
  var topParentFid = queryParsed.f || 0;

  // Collect the child items for each affected folder
  var updates = {};
  toSave.each(function(){
    var tbodyElement = $(this);
    var parentFid = topParentFid;
    var parentFolderRow = tbodyElement.closest('.material-row-folder');
    if(parentFolderRow.length){
      parentFid = parentFolderRow.attr('id').split('-')[1];
    }
    updates[parentFid] = {};
    tbodyElement.children().not('.materials-row-add').not('reorder-target-placeholder').not('.type-empty').each(function(){
      var row = $(this);
      updates[parentFid][row.attr('id')] = row.attr('display_weight');
    });
  });

  // Send to server
  var path = window.location.pathname.substring(1);
  var courseID = path.split('/')[1];
  $.ajaxSecure({
    url : '/course/' + courseID + '/materials/reorder',
    data: {updates: updates, root_fid: topParentFid, dropped_item_id: droppedItemId},
    type: 'POST',
    success: function(){
      $('#folder-reorder-save-loader').remove();
    },
    error: function(){
      $('#folder-reorder-save-loader').remove();
    }
  });

}

/**
 * Check whether the current course materials listing is the view without the materials index
 * The "no index" view allows materials items to be placed in the root level of the materials
 *
 * @return bool
 */
function sCourseMaterialsDisplayIsWithoutIndex(){
  var displayMode = sCommonGetSetting('s_course', 'display_mode');
  return displayMode && displayMode == sCommonGetSetting('s_course', 'display_mode_without_index');
}
;var quickInstallAutoLaunchClicked = false;

Drupal.behaviors.sAppLauncher = function(context) {
  Drupal.settings.s_app = Drupal.settings.s_app || {};
  
  if(!quickInstallAutoLaunchClicked && typeof Drupal.settings.s_app != 'undefined'){
    if(Drupal.settings.s_app.auto_launch_quick_install){
      $('.app-quick-installer-popup').click();
      quickInstallAutoLaunchClicked = true;
    }
  }
  
  $("#schoology-app-loader:not(.sAppLauncher-processed)", context).addClass('sAppLauncher-processed').each(function(){
    if(Drupal.settings.s_app.launcher){
      var params = sAppLauncherGetParams({type: 'standard', isImport: false, url: location.href});
      var launchKey = params.appNid + '-' + params.realm +'-' + params.realmID;
      if(Drupal.settings.s_app.launcher.hasOwnProperty(launchKey)) {
        var contentWrapper = $('#content-wrapper');
        var csmSectionToggle = $('#csm-section-toggle');
        var launchSettings = Drupal.settings.s_app.launcher[launchKey];
        var output = Drupal.theme('sAppContainer', launchSettings.type, launchSettings.url, launchSettings.cookie_required,
          csmSectionToggle.length ? csmSectionToggle.html() : '');
        contentWrapper.html(output);
        sAttachBehaviors(['sAppLauncher'], contentWrapper);
      }
    }
    $(this).remove();
  });
  
  $("#schoology-app-container:not(.sAppLauncher-processed)", context).addClass('sAppLauncher-processed').each(function(){
    // Resize the iframe that contains the app so it takes up the maximum height remaining in the viewport affter
    // taking into account the header (#header) and the breadcrumbs area (#center-top)
    var appWindowObj = $(this);
    $(window).resize(function() {
      var new_height = $(this).height();
      $('#header, #center-top:visible').each(function() {
        new_height -= $(this).outerHeight();
      });
      appWindowObj.height(new_height);
    }).trigger('resize');
    
    //hide the dropdown for courses, groups, and resources if the app iframe is clicked
    var bound = false;
    $('.primary-activities .clickable').each(function(){
      $(this).click(function(){
        if(!bound){
          var iframeMouseOver = false
          if($.browser.msie && $.browser.version.charAt(0) == 8){
            document.onfocusout = function(){ //need to use document.onfocusout for IE8
              if(iframeMouseOver){
                $('.activities-dropdown-wrapper').hide();
                bound = false;
              }
            };
          }
          else{
            $(window).bind('blur.sAppLauncher', function(){
              if(iframeMouseOver){
                $('.activities-dropdown-wrapper').hide();
                $(window).unbind('blur.sAppLauncher');
                bound = false;
              }
            });
          }
            
          appWindowObj.bind('mouseover',function(){
            iframeMouseOver = true;
          });
          appWindowObj.bind('mouseout',function(){
            iframeMouseOver = false;
          });
        }
        bound = true;
      });
    });
    
    // allow users to launch manaually if auto-launch fails (popup blocker)
    $(".s-js-launch-button", appWindowObj).bind('click', function(e){
      e.preventDefault();
      if($(this).hasClass('disabled')) {
        return;
      }
      var newWin = sCommonOpenNewWindow($(this).attr('href'), {name: 'schoology-app'});
      if(newWin !== false) {
        $(this).addClass('disabled');
        $(this).prev('.app-launch-message').html(Drupal.t('Your app has been launched in a new window.'));
        newWin.focus();
      }
    });
    $('.s-js-launch-button', appWindowObj).trigger('click');
  });

  /**
   * s_tinymce insert resource app content form
   */
  $('#s-js-tinymce-resources-insert-form-wrapper:not(.sTinymceResourcesInsert-processed)', context)
    .addClass('sTinymceResourcesInsert-processed').each(function()
    {
      var contentEmbedForm = $('#s-tinymce-resources-insert-form', $(this));
      var appNid = parseInt( $('#edit-app-nid', contentEmbedForm).val() );
      var appType = $('#edit-app-type', contentEmbedForm).val();
      var realm = $('#edit-realm', contentEmbedForm).val();
      var realmId = parseInt( $('#edit-realm-id', contentEmbedForm).val() );
      var folderId = parseInt( $('#edit-folder-id', contentEmbedForm).val() );
      var fWeight = parseInt( $('#edit-fweight', contentEmbedForm).val() );

      var app = {};
      app['type'] = appType;
      app['isRTE'] = true;
      if(appType == 'resources') {
        app['url'] = '/resources/apps/'+ appNid +'/run';
      }
      else if(appType == 'lti') {
        app['url'] = '/apps/lti/'+ appNid +'/run/'+ realm +'/'+ realmId + '?f=' + folderId + '&fweight=' + fWeight;
      }
      // not supported?
      else {
        return;
      }

      sAppLauncher($('#s-js-resources-app-container', contentEmbedForm), app);
  });
}

Drupal.theme.prototype.sAppContainer = function(launchType, launchUrl, cookieRequired, csm_toggle) {
  var template = '';
  
  if(cookieRequired) {
    template += '<div class="cookie-warning">';
    template += '<p class="app-launch-message">'+ Drupal.t('This app must be launched by clicking on its link on the left menu.') +'</p>';
    template += '</div>';
    return template;
  }
  
  if(launchType == 2) {
    template += '<div id="schoology-app-container" align="center">';
    template += '<p class="app-launch-message">'+ Drupal.t('We attempted to launch your app in a new window, but a popup blocker is preventing it from opening. Please disable popup blockers for this site.') +'</p>';
    template += '<a class="link-btn s-js-launch-button" href="'+ launchUrl +'">'+ Drupal.t('Launch App') +'</a>';
    template += '</div>';
  }
  else {
    if(csm_toggle){
      template += '<div id="schoology-csm_toggle" align="left">';
      template += '<p>'+ csm_toggle +'</p>';
      template += '</div>';
    }
    template += '<iframe id="schoology-app-container" frameborder="0" width="100%" height="800" src="'+ launchUrl +'" name="schoology-app-container"></iframe>';
  }
  
  return template;
};

function sAppLauncher(target, app) {
  if(!Drupal.settings.s_app.launcher) {
    Drupal.settings.s_app.launcher = {};
  }
  var params = sAppLauncherGetParams(app);
  var launchKey = params.appNid + '-' + params.realm +'-' + params.realmID;
  
  function renderApp(launchSettings) {
    var url = launchSettings.url;

    if (url && $.isPlainObject(app.params)) {
      url += (url.indexOf('?') === -1 ? '?' : '&') + $.param(app.params);
    }

    var output = Drupal.theme('sAppContainer', launchSettings.type, url, launchSettings.cookie_required);
    target.html(output);
    sAttachBehaviors(['sAppLauncher'], target);
  }
  
  if(Drupal.settings.s_app.launcher.hasOwnProperty(launchKey)) {
    renderApp( Drupal.settings.s_app.launcher[launchKey] );
    return;
  }
  
  sToggleActiveLoader('sAppLauncher', target);
  $.getJSON(params.settingsURI, function(data) {
    sToggleActiveLoader('sAppLauncher');
    
    Drupal.settings.s_app.launcher[launchKey] = data.body;
    renderApp( Drupal.settings.s_app.launcher[launchKey] );
  });
}

function sAppLauncherGetParams(app) {
  var q_params = {
    import_view: app.isImport ? 1 : 0
  };
  var url = '';
  var appNid = 0;
  var appRealm = '';
  var appRealmID = 0;
  var qParams = {};
  
  function parse_str(q_string, q_params) {
    if(q_string != '') {
      var q_string = q_string.split('&');
      for(i = 0; i < q_string.length; i++) {
        var key_val = q_string[i].split('=');
        q_params[ key_val[0] ] = key_val[1];
      }
    }
  }
  
  if(app.type == 'resources') {
    var parsed_url = app.url.match(/\/([0-9]+)\/run(\?)?(.*)/);
    appNid = parsed_url[1];
    appRealm = 'user';
    appRealmID = Drupal.settings.s_common.user.uid;
    url += appNid + '/' + app.type;
    parse_str(parsed_url[3], q_params);
  }
  else if(app.type == 'standard' || app.type == 'lti') {
    if(app.url.indexOf('/apps/school_apps/') != -1) {
      var parsed_url = app.url.match(/\/apps\/school_apps\/([0-9]+)\/configure(\?)?(.*)/);
      appNid = parsed_url[1];
      appRealm = 'school';
      appRealmID = Drupal.settings.s_common.user.school_nid;
    }
    else {
      var parsed_url = app.url.match(/\/([0-9]+)\/run\/([a-z]+)\/([0-9]+)(\?)?(.*)/);
      appNid = parsed_url[1];
      appRealm = parsed_url[2];
      appRealmID = parsed_url[3];
      qParams = getQueryParams(app.url);
    }
    url += appNid + '/' + app.type + '/' + appRealm + '/' + appRealmID;
    if(typeof app.isRTE != 'undefined' && app.isRTE == true){
      url += '&from=rte';
      if(qParams && typeof qParams.f != 'undefined') {
        url += '&f=' + String(qParams.f);
      }

      if(qParams && typeof qParams.fweight != 'undefined') {
        url += '&fweight=' + String(qParams.fweight);
      }
    }
  }
  
  if(url == '') {
    return false;
  }
  
  // we need to preserve the query strings for resources apps (import view, dropbox ..etc)
  var url_params = [];
  if(app.type == 'resources') {
    $.each(q_params, function(key, value) {
      url_params.push(key + "=" + encodeURIComponent(value));
    });
    url += '?' + url_params.join('&');
  }
  url = '/iapi/app/launcher/' + url;
  
  return {
    appNid: appNid,
    realm: appRealm,
    realmID: appRealmID,
    settingsURI: url
  };
}

function sAppLauncherClearCache(appNid) {
  // clear cached launch data since we store cookie preload attenpts in session
  for(var appKey in Drupal.settings.s_app.launcher) {
    if(appKey.split('-')[0] == appNid) {
      delete Drupal.settings.s_app.launcher[appKey];
      break;
    }
  }
}
;Drupal.behaviors.sAppMenu = function(context) {

  // Launch the cookie preload popup as soon as an app is launched
  $("#menu-s-apps-list .app-link:not(.sAppMenu-processed), .resources-app-list .s-js-app-launch.resources-app-title:not(.sAppMenu-processed)", context).addClass('sAppMenu-processed').each(function(){
    var link = $(this);
    var isResouceApp = link.hasClass('resources-app-title');
    
    // This needs to be bound by a user's click behavior; otherwise,
    // the popup will be blocked by the browser
    link.click(function(e){
      var appNid, appUrl, cookiePreloadUrl;

      if(!isResouceApp) {
        appNid = link.parents('.app-link-wrapper').attr('id').split('-')[2];
        appUrl = link.attr('href');
      }
      else {
        appNid = link.parents('.s-app-resource-app').attr('id').split('-')[1];
        appUrl = link.attr('href');
      }

      cookiePreloadUrl = sCommonGetSetting('s_app', 'cookie_preload_urls', appNid);
      if(cookiePreloadUrl) {
        // Prevent the app from launching immediately
        e.preventDefault();
        if(isResouceApp) {
          // for resource apps, also prevent other click handlers before running cookie preloader
          e.stopImmediatePropagation();
        }

        sAppMenuCookiePreloadRun(appNid, cookiePreloadUrl, function(){
          if(!isResouceApp) {
            window.location = appUrl;
          }
          else {
            // clear cached launch data since we store cookie preload attempts in session
            sAppLauncherClearCache(appNid);
            sAppMenuCookiePreloadDelete(appNid);
            // now trigger app click since the cookie preloader is done
            link.trigger('click.s-js-library-ajax-links');
          }
        });
      }
    });
  });
}

function sAppMenuCookiePreloadRun(appNid, cookiePreloadUrl, afterPreloadCallback) {
  // Open the cookie preload window
  window.open(cookiePreloadUrl,'cookiepreloader','width=100,height=100,toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=0,left=0,top=0');

  // Make a synchronous call to mark this app's cookies as loaded.
  // If the app loads before this call is made, it might end up in a browser loop.
  $.ajax({
    url: '/apps/' + appNid + '/cookies_loaded',
    async: false
  });

  // After a short moment to allow the popup to load, continue launching the app
  setTimeout(afterPreloadCallback, 800);
}

function sAppMenuCookiePreloadSet(data) {
  Drupal.settings.s_app = Drupal.settings.s_app || {};
  Drupal.settings.s_app.cookie_preload_urls = Drupal.settings.s_app.cookie_preload_urls || {};
  for(var appKey in data) {
    Drupal.settings.s_app.cookie_preload_urls[appKey] = data[appKey];
  }
}

function sAppMenuCookiePreloadDelete(appNid) {
  delete Drupal.settings.s_app.cookie_preload_urls[appNid];
};/*
 * jQuery Form Plugin
 * version: 2.25 (08-APR-2009)
 * @requires jQuery v1.2.2 or later
 * @note This has been modified for ajax.module
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}(';(5($){$.B.1s=5(u){2(!4.G){R(\'1b: 2M 9 2N - 2O 2P 1t\');6 4}2(S u==\'5\')u={T:u};3 v=4.14(\'1c\')||1d.2Q.2R;v=(v.2S(/^([^#]+)/)||[])[1];v=v||\'\';u=$.1n({1e:v,H:4.14(\'1u\')||\'1Q\'},u||{});3 w={};4.L(\'C-1R-1S\',[4,u,w]);2(w.1T){R(\'1b: 9 1U 1o C-1R-1S L\');6 4}2(u.1v&&u.1v(4,u)===I){R(\'1b: 9 1f 1o 1v 1V\');6 4}3 a=4.1w(u.2T);2(u.J){u.O=u.J;K(3 n 1x u.J){2(u.J[n]2U 15){K(3 k 1x u.J[n])a.D({7:n,8:u.J[n][k]})}E a.D({7:n,8:u.J[n]})}}2(u.1y&&u.1y(a,4,u)===I){R(\'1b: 9 1f 1o 1y 1V\');6 4}4.L(\'C-9-1W\',[a,4,u,w]);2(w.1T){R(\'1b: 9 1U 1o C-9-1W L\');6 4}3 q=$.1z(a);2(u.H.2V()==\'1Q\'){u.1e+=(u.1e.2W(\'?\')>=0?\'&\':\'?\')+q;u.J=F}E u.J=q;3 x=4,V=[];2(u.2X)V.D(5(){x.1X()});2(u.2Y)V.D(5(){x.1Y()});2(!u.16&&u.17){3 y=u.T||5(){};V.D(5(a){$(u.17).2Z(a).P(y,1Z)})}E 2(u.T)V.D(u.T);u.T=5(a,b){K(3 i=0,M=V.G;i<M;i++)V[i].30(u,[a,b,x])};3 z=$(\'W:31\',4).18();3 A=I;K(3 j=0;j<z.G;j++)2(z[j])A=Q;2(u.20||A){2(u.21)$.32(u.21,1A);E 1A()}E $.33(u);4.L(\'C-9-34\',[4,u]);6 4;5 1A(){3 h=x[0];2($(\':W[7=9]\',h).G){35(\'36: 37 22 38 39 3a 3b "9".\');6}3 i=$.1n({},$.23,u);3 s=$.1n(Q,{},$.1n(Q,{},$.23),i);3 j=\'3c\'+(1B 3d().3e());3 k=$(\'<20 3f="\'+j+\'" 7="\'+j+\'" 24="25:26" />\');3 l=k[0];k.3g({3h:\'3i\',27:\'-28\',29:\'-28\'});3 m={1f:0,19:F,1g:F,3j:0,3k:\'n/a\',3l:5(){},2a:5(){},3m:5(){},3n:5(){4.1f=1;k.14(\'24\',\'25:26\')}};3 g=i.2b;2(g&&!$.1C++)$.1h.L("3o");2(g)$.1h.L("3p",[m,i]);2(s.2c&&s.2c(m,s)===I){s.2b&&$.1C--;6}2(m.1f)6;3 o=0;3 p=0;3 q=h.U;2(q){3 n=q.7;2(n&&!q.1i){u.O=u.O||{};u.O[n]=q.8;2(q.H=="X"){u.O[7+\'.x\']=h.Y;u.O[7+\'.y\']=h.Z}}}1j(5(){3 t=x.14(\'17\'),a=x.14(\'1c\');h.1k(\'17\',j);2(h.2d(\'1u\')!=\'2e\')h.1k(\'1u\',\'2e\');2(h.2d(\'1c\')!=i.1e)h.1k(\'1c\',i.1e);2(!u.3q){x.14({3r:\'2f/C-J\',3s:\'2f/C-J\'})}2(i.1D)1j(5(){p=Q;11()},i.1D);3 b=[];2g{2(u.O)K(3 n 1x u.O)b.D($(\'<W H="3t" 7="\'+n+\'" 8="\'+u.O[n]+\'" />\').2h(h)[0]);k.2h(\'1l\');l.2i?l.2i(\'2j\',11):l.3u(\'2k\',11,I);h.9()}3v{h.1k(\'1c\',a);t?h.1k(\'17\',t):x.3w(\'17\');$(b).2l()}},10);3 r=0;5 11(){2(o++)6;l.2m?l.2m(\'2j\',11):l.3x(\'2k\',11,I);3 c=Q;2g{2(p)3y\'1D\';3 d,N;N=l.2n?l.2n.2o:l.2p?l.2p:l.2o;2((N.1l==F||N.1l.2q==\'\')&&!r){r=1;o--;1j(11,2r);6}m.19=N.1l?N.1l.2q:F;m.1g=N.2s?N.2s:N;m.2a=5(a){3 b={\'3z-H\':i.16};6 b[a]};2(i.16==\'3A\'||i.16==\'3B\'){3 f=N.1E(\'1F\')[0];m.19=f?f.8:m.19}E 2(i.16==\'2t\'&&!m.1g&&m.19!=F){m.1g=2u(m.19)}d=$.3C(m,i.16)}3D(e){c=I;$.3E(i,m,\'2v\',e)}2(c){i.T(d,\'T\');2(g)$.1h.L("3F",[m,i])}2(g)$.1h.L("3G",[m,i]);2(g&&!--$.1C)$.1h.L("3H");2(i.2w)i.2w(m,c?\'T\':\'2v\');1j(5(){k.2l();m.1g=F},2r)};5 2u(s,a){2(1d.2x){a=1B 2x(\'3I.3J\');a.3K=\'I\';a.3L(s)}E a=(1B 3M()).3N(s,\'1G/2t\');6(a&&a.2y&&a.2y.1p!=\'3O\')?a:F}}};$.B.3P=5(c){6 4.2z().2A(\'9.C-1q\',5(){$(4).1s(c);6 I}).P(5(){$(":9,W:X",4).2A(\'2B.C-1q\',5(e){3 a=4.C;a.U=4;2(4.H==\'X\'){2(e.2C!=12){a.Y=e.2C;a.Z=e.3Q}E 2(S $.B.2D==\'5\'){3 b=$(4).2D();a.Y=e.2E-b.29;a.Z=e.2F-b.27}E{a.Y=e.2E-4.3R;a.Z=e.2F-4.3S}}1j(5(){a.U=a.Y=a.Z=F},10)})})};$.B.2z=5(){4.2G(\'9.C-1q\');6 4.P(5(){$(":9,W:X",4).2G(\'2B.C-1q\')})};$.B.1w=5(b){3 a=[];2(4.G==0)6 a;3 c=4[0];3 d=b?c.1E(\'*\'):c.22;2(!d)6 a;K(3 i=0,M=d.G;i<M;i++){3 e=d[i];3 n=e.7;2(!n)1H;2(b&&c.U&&e.H=="X"){2(!e.1i&&c.U==e)a.D({7:n+\'.x\',8:c.Y},{7:n+\'.y\',8:c.Z});1H}3 v=$.18(e,Q);2(v&&v.1r==15){K(3 j=0,2H=v.G;j<2H;j++)a.D({7:n,8:v[j]})}E 2(v!==F&&S v!=\'12\')a.D({7:n,8:v})}2(!b&&c.U){3 f=c.1E("W");K(3 i=0,M=f.G;i<M;i++){3 g=f[i];3 n=g.7;2(n&&!g.1i&&g.H=="X"&&c.U==g)a.D({7:n+\'.x\',8:c.Y},{7:n+\'.y\',8:c.Z})}}6 a};$.B.3T=5(a){6 $.1z(4.1w(a))};$.B.3U=5(b){3 a=[];4.P(5(){3 n=4.7;2(!n)6;3 v=$.18(4,b);2(v&&v.1r==15){K(3 i=0,M=v.G;i<M;i++)a.D({7:n,8:v[i]})}E 2(v!==F&&S v!=\'12\')a.D({7:4.7,8:v})});6 $.1z(a)};$.B.18=5(a){K(3 b=[],i=0,M=4.G;i<M;i++){3 c=4[i];3 v=$.18(c,a);2(v===F||S v==\'12\'||(v.1r==15&&!v.G))1H;v.1r==15?$.3V(b,v):b.D(v)}6 b};$.18=5(b,c){3 n=b.7,t=b.H,1a=b.1p.1I();2(S c==\'12\')c=Q;2(c&&(!n||b.1i||t==\'1m\'||t==\'3W\'||(t==\'1J\'||t==\'1K\')&&!b.1L||(t==\'9\'||t==\'X\')&&b.C&&b.C.U!=b||1a==\'13\'&&b.1M==-1))6 F;2(1a==\'13\'){3 d=b.1M;2(d<0)6 F;3 a=[],1N=b.3X;3 e=(t==\'13-2I\');3 f=(e?d+1:1N.G);K(3 i=(e?d:0);i<f;i++){3 g=1N[i];2(g.1t){3 v=g.8;2(!v)v=(g.1O&&g.1O[\'8\']&&!(g.1O[\'8\'].3Y))?g.1G:g.8;2(e)6 v;a.D(v)}}6 a}6 b.8};$.B.1Y=5(){6 4.P(5(){$(\'W,13,1F\',4).2J()})};$.B.2J=$.B.3Z=5(){6 4.P(5(){3 t=4.H,1a=4.1p.1I();2(t==\'1G\'||t==\'40\'||1a==\'1F\')4.8=\'\';E 2(t==\'1J\'||t==\'1K\')4.1L=I;E 2(1a==\'13\')4.1M=-1})};$.B.1X=5(){6 4.P(5(){2(S 4.1m==\'5\'||(S 4.1m==\'41\'&&!4.1m.42))4.1m()})};$.B.43=5(b){2(b==12)b=Q;6 4.P(5(){4.1i=!b})};$.B.2K=5(b){2(b==12)b=Q;6 4.P(5(){3 t=4.H;2(t==\'1J\'||t==\'1K\')4.1L=b;E 2(4.1p.1I()==\'2L\'){3 a=$(4).44(\'13\');2(b&&a[0]&&a[0].H==\'13-2I\'){a.45(\'2L\').2K(I)}4.1t=b}})};5 R(){2($.B.1s.46&&1d.1P&&1d.1P.R)1d.1P.R(\'[47.C] \'+15.48.49.4a(1Z,\'\'))}})(4b);',62,260,'||if|var|this|function|return|name|value|submit||||||||||||||||||||||||||||fn|form|push|else|null|length|type|false|data|for|trigger|max|doc|extraData|each|true|log|typeof|success|clk|callbacks|input|image|clk_x|clk_y||cb|undefined|select|attr|Array|dataType|target|a_fieldValue|responseText|tag|ajaxSubmit|action|window|url|aborted|responseXML|event|disabled|setTimeout|setAttribute|body|reset|extend|via|tagName|plugin|constructor|a_ajaxSubmit|selected|method|beforeSerialize|a_formToArray|in|beforeSubmit|param|fileUpload|new|active|timeout|getElementsByTagName|textarea|text|continue|toLowerCase|checkbox|radio|checked|selectedIndex|ops|attributes|console|GET|pre|serialize|veto|vetoed|callback|validate|a_resetForm|a_clearForm|arguments|iframe|closeKeepAlive|elements|ajaxSettings|src|about|blank|top|1000px|left|getResponseHeader|global|beforeSend|getAttribute|POST|multipart|try|appendTo|attachEvent|onload|load|remove|detachEvent|contentWindow|document|contentDocument|innerHTML|100|XMLDocument|xml|toXml|error|complete|ActiveXObject|documentElement|a_ajaxFormUnbind|bind|click|offsetX|offset|pageX|pageY|unbind|jmax|one|a_clearFields|a_selected|option|skipping|process|no|element|location|href|match|semantic|instanceof|toUpperCase|indexOf|resetForm|clearForm|html|apply|file|get|ajax|notify|alert|Error|Form|must|not|be|named|jqFormIO|Date|getTime|id|css|position|absolute|status|statusText|getAllResponseHeaders|setRequestHeader|abort|ajaxStart|ajaxSend|skipEncodingOverride|encoding|enctype|hidden|addEventListener|finally|removeAttr|removeEventListener|throw|content|json|script|httpData|catch|handleError|ajaxSuccess|ajaxComplete|ajaxStop|Microsoft|XMLDOM|async|loadXML|DOMParser|parseFromString|parsererror|a_ajaxForm|offsetY|offsetLeft|offsetTop|a_formSerialize|a_fieldSerialize|merge|button|options|specified|a_clearInputs|password|object|nodeType|a_enable|parent|find|debug|jquery|prototype|join|call|jQuery'.split('|'),0,{}));/**
 * Automatic ajax validation
 *
 * @see http://drupal.org/project/ajax
 * @see irc://freenode.net/#drupy
 * @depends Drupal 6
 * @author brendoncrawford
 * @note This file uses a 79 character width limit.
 * 
 *
 */

Drupal.Ajax = new Object;

Drupal.Ajax.plugins = {};

Drupal.Ajax.firstRun = false;

/**
 * Init function.
 * This is being executed by Drupal behaviours.
 * See bottom of script.
 * 
 * @param {HTMLElement} context
 * @return {Bool}
 */
Drupal.Ajax.init = function(context) {
  var f, s;
  if (f = $('.ajax-form:not(.AjaxProcessed)', context).addClass('AjaxProcessed')) {  
    if (!Drupal.Ajax.firstRun) {
      Drupal.Ajax.invoke('init');
      Drupal.Ajax.firstRun = true;
    }
    s = $('input[type="submit"]', f);
    s.click(function(e){
      var $submit = $(this);
      this.form.ajax_activator = $submit;
      //Allow us to handle pre-submit event by attach function callback to submit element
      var beforeSubmit = $submit.data('beforeSubmitHandler');
      if (typeof beforeSubmit === 'function') {
        beforeSubmit(e);
      }
      return true;
    });
    f.each(function(){
      this.ajax_activator = null;
      $(this).submit(function(){
        if (this.ajax_activator === null) {
          this.ajax_activator = $('.form-submit', this);
        }
        if (this.ajax_activator.hasClass('ajax-trigger')) {
          Drupal.Ajax.go($(this), this.ajax_activator);
          return false;
        }
        else {
          return true;
        }
      });
      return true;
    });
  }
  return true;
};

/**
 * Invokes plugins
 * 
 * @param {Object} formObj
 * @param {Object} submitter
 */
Drupal.Ajax.invoke = function(hook, args) {
  var plugin, r, ret;
  ret = true;
  for (plugin in Drupal.Ajax.plugins) {
    r = Drupal.Ajax.plugins[plugin](hook, args);
    if (r === false) {
      ret = false;
    }
  }
  return ret;
};

/**
 * Handles submission
 * 
 * @param {Object} submitter_
 * @return {Bool}
 */
Drupal.Ajax.go = function(formObj, submitter) {
  var submitterVal, submitterName, extraData;
  Drupal.Ajax.invoke('submit', {submitter:submitter});
  submitterVal = submitter.val();
  submitterName = submitter.attr('name');
  extraData = {};
  extraData[submitterName] = submitterVal;
  extraData['drupal_ajax'] = '1';
  formObj.a_ajaxSubmit({
    extraData : extraData,
    beforeSubmit : function(data) {
      data[data.length] = {
        name : submitterName,
        value : submitterVal
      };
      data[data.length] = {
        name : 'drupal_ajax',
        value : '1'
      };
      return true;
    },
    dataType : 'json',
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      window.alert(Drupal.t('ajax.module: An unknown error has occurred.'));
      // log the error
      $.post('/popups_error', {
        'error': textStatus,
        'status' : XMLHttpRequest.status,
        'response' : XMLHttpRequest.responseText,
        'error_type' : 'ajax',
      });
      if (window.console) {
        console.log('error', arguments);
      }
      return true;
    },
    success: function(data){
      submitter.val(submitterVal);
      Drupal.Ajax.response(submitter, formObj, data);
      return true;
    }
  });
  return false;
};

/**
 * Handles messaging
 * 
 * @param {Object} formObj
 * @param {Object} submitter
 * @param {Object} data
 * @param {Object} options
 * @return {Bool}
 */
Drupal.Ajax.message = function(formObj, submitter, data, options) {
  var args; 
  data.local = {
    submitter : submitter,
    form : formObj
  };
  if (Drupal.Ajax.invoke('message', data)) {
    Drupal.Ajax.writeMessage(data.local.form, data.local.submitter, options);
    Drupal.Ajax.invoke('afterMessage', data);
  }
  return true;
};

/**
 * Writes message
 * 
 * @param {Object} formObj
 * @param {Object} submitter
 * @param {Object} options
 * @return {Bool}
 */
Drupal.Ajax.writeMessage = function(formObj, submitter, options) {
  var i, _i, thisItem, log, errBox, h, data;
  if (options.action === 'notify') {
    // Cleanups
    $('.messages, .ajax-preview', formObj).remove();
    $('input, textarea').removeClass('error status warning required');
    // Preview
    if (options.type === 'preview') {
      log = $('<div>').addClass('ajax-preview');
      log.html(options.messages);
      formObj.prepend(log);
    }
    // Status, Error, Message
    else {
      log = $('<ul>');
      errBox = $(".messages." + options.type, formObj[0])
      for (i = 0, _i = options.messages.length; i < _i; i++) {
        thisItem = $('#' + options.messages[i].id, formObj[0])
        thisItem.addClass(options.type);
        if (options.messages[i].required) {
          thisItem.addClass('required');
        }
        log.append('<li>' + options.messages[i].value + '</li>');
      }
      if (errBox.length === 0) {
        errBox = $("<div class='messages " + options.type + "'>");
        formObj.prepend(errBox);
      }
      errBox.html(log); 
    }
  }
  else if (options.action === 'clear') {
    $('.messages, .ajax-preview', formObj).remove();
  }
  return true;
};

/**
 * Updates message containers
 * 
 * @param {Object} updaters
 * @return {Bool}
 */
Drupal.Ajax.updater = function(updaters) {
  var i, _i, elm;
  for (i = 0, _i = updaters.length; i < _i; i++) {
    elm = $(updaters[i].selector);
    // HTML:IN
    if (updaters[i].type === 'html_in') {
      elm.html(updaters[i].value);
    }
    // HTML:OUT
    else if (updaters[i].type === 'html_out') {
      elm.replaceWith(updaters[i].value);
    }
    // FIELD
    else if (updaters[i].type === 'field') {
      elm.val(updaters[i].value);
    }
    // REMOVE
    else if(updaters[i].type === 'remove') {
      elm.remove();
    }
  }
  return true;
};

/**
 * Handles data response
 * 
 * @param {Object} submitter
 * @param {Object} formObj
 * @param {Object} data
 * @return {Bool}
 */
Drupal.Ajax.response = function(submitter, formObj, data){
  var newSubmitter;
  data.local = {
    submitter : submitter,
    form : formObj
  };
  /**
   * Failure
   */
  if (data.status === false) {
    Drupal.Ajax.updater(data.updaters);
    Drupal.Ajax.message(formObj, submitter, data, {
      action : 'notify',
      messages : data.messages_error,
      type : 'error'
    });
  }
  /**
   * Success
   */
  else {
    // Display preview
    if (data.preview !== null) {
      Drupal.Ajax.updater(data.updaters);
      Drupal.Ajax.message(formObj, submitter, data, {
        action : 'notify',
        messages : decodeURIComponent(data.preview),
        type : 'preview'
      });
    }
    // If no redirect, then simply show messages
    else if (data.redirect === null) {
      if (data.messages_status.length > 0) {
        Drupal.Ajax.message(formObj, submitter, data, {
          action : 'notify',
          messages : data.messages_status,
          type : 'status'
        });
      }
      if (data.messages_warning.length > 0) {
        Drupal.Ajax.message(formObj, submitter, data, {
          action : 'notify',
          messages : data.messages_warning,
          type : 'warning'
        });
      }
      if (data.messages_status.length === 0 &&
          data.messages_warning.length === 0) {
        Drupal.Ajax.message(formObj, submitter, data, {action:'clear'});
      }
    }
    // Redirect
    else {
      if (Drupal.Ajax.invoke('redirect', data)) {
        Drupal.Ajax.redirect( data.redirect );
      }
      else {
        Drupal.Ajax.updater(data.updaters);
        if (data.messages_status.length === 0 &&
            data.messages_warning.length === 0) {
          Drupal.Ajax.message(formObj, submitter, data, {action:'clear'});
        }
        else {
          Drupal.Ajax.message(formObj, submitter, data, {
            action : 'notify',
            messages : data.messages_status,
            type : 'status'
          });
        }
      }
    }
  }
  return true;
};


/**
 * Redirects to appropriate page
 * 
 * @todo
 *   Some of this functionality should possibly hapen on
 *   the server instead of client.
 * @param {String} url
 */
Drupal.Ajax.redirect = function(url) {
  window.location.href = url;
};

Drupal.behaviors.Ajax = Drupal.Ajax.init;



;