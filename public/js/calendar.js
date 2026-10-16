const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const selectedDate = document.getElementById("selectedDate");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let currentDate = new Date();
let selected = null;

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

        button.className = `
          h-10 w-10 mx-auto rounded-full
          flex items-center justify-center
          text-sm transition
          hover:bg-blue-100 hover:text-blue-600
          ${isToday ? "ring-2 ring-blue-500" : ""}
          ${isSelected ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white" : "text-gray-700"}
        `;

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