$(document).ready(function() {
  $('form').on('submit', function() {

    $.ajax({
      type: 'POST',
      url: '/register';
      return false;
    })
  });
});
