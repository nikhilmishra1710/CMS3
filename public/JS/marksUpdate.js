$('#updateMarksForm').on('submit', async function (e) {
    e.preventDefault();
    alert('Form submitted'); // Test if form submission is working

    const studentMarks = [];
    const inputs = $('input[name="marks"]');

    inputs.each(function () {
        const s_id = $(this).data('id'); // Get data-id using jQuery
        const marks = parseFloat($(this).val()); // Get value using jQuery
        if (!isNaN(marks)) {
            studentMarks.push({ s_id, marks });
        }
    });

    const response = await $.ajax({
        url: '/exams/${<%= exams[0].exam_id %>}/marks', // Use template literals inside jQuery
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ studentMarks })
    });

    if (response) {
        alert('Marks updated successfully');
        // Optionally, redirect or reload the page
        window.location.reload();
    } else {
        alert('Error updating marks');
    }
});
