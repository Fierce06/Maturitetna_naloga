const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const selectedDate = document.getElementById("selectedDate");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let currentDate = new Date();
let selected = null;

let examDates = [];

function renderCalendar() {
    calendar.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    monthYear.textContent = new Date(year, month).toLocaleDateString(
        "en-US",
        {
            month: "long",
            year: "numeric"
        }
    );

    // Empty days before the first day
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.className = "h-10";
        calendar.appendChild(empty);
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
        const button = document.createElement("button");

        const date = new Date(year, month, day);

        const isToday =
            date.toDateString() === new Date().toDateString();

        const isSelected =
            selected &&
            date.toDateString() === selected.toDateString();

        button.textContent = day;

        const formattedDate = date.toISOString().split("T")[0];

        button.className = `
    h-10 w-10 mx-auto rounded-full
    flex items-center justify-center
    text-sm font-medium
    transition-all duration-200
    hover:scale-105

    ${
        examDates.includes(formattedDate)
            ? "bg-red-50 border-2 border-red-300 text-red-600 hover:bg-red-100"
            : "border-2 border-transparent text-gray-700 hover:bg-blue-50 hover:text-blue-600"
    }

    ${
        isToday
            ? "ring-2 ring-blue-500 ring-offset-2"
            : ""
    }

    ${
        isSelected
            ? examDates.includes(formattedDate)
                ? "bg-red-500 border-red-500 text-white hover:bg-red-600 hover:text-white"
                : "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:text-white"
            : ""
    }
`;

        button.setAttribute("id", formattedDate);

        button.addEventListener("click", () => {
            selected = date;

            renderCalendar();
        });

        calendar.appendChild(button);
    }
}

prevBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

renderCalendar();

function allExams() {
    $.ajax({
        url: '/api/exams/',
        method: 'GET',

        success: function (odgovor) {
            if (odgovor.success == false) {
            }

            examsList = $('#upcomingExams');
            examsList.empty();  

            odgovor.exams.forEach(exam => {
                const examElement = $(`
                    <div class="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md">
                        <div class="flex items-center justify-between">
                            <h1 class="text-md font-semibold text-slate-900">${exam.title}</h1>
                            <span class="text-sm text-slate-500">${new Date(exam.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                `);

                examsList.append(examElement);
                
            })

            examDates = odgovor.exams.map(exam => exam.date.slice(0, 10));
            renderCalendar();
        },
        error: function (xhr) {
            const msg = xhr.responseJSON?.error || `Napaka: ${xhr.status} ${xhr.statusText}`;

        }
    });
}
$(document).ready(function () {
    allExams();

})