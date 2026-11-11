/* Every programme a student can choose. This one file is used by the sign-up page and by the server,
   so to add or rename a programme, edit it here. Faculty names are worked out from the programme name below. */
(function (root) {
  var UNDERGRADUATE = [
    'Bachelor in Early Childhood Education Honours B.ECE (Hons)',
    'Bachelor of Accounting Honours',
    'Bachelor of Arts Honours in English and Communication Studies',
    'Bachelor of Arts Honours in Gender and Cultural Studies',
    'Bachelor of Arts Honours in Media and Journalism',
    'Bachelor of Arts Honours in Religion and Community Health',
    'Bachelor of Arts Honours in Translation and Interpretation in Languages',
    'Bachelor of Arts Honours with Education Specialising in English, Geography, History, Religious Studies and Music',
    'Bachelor of Business Studies Honours in Management',
    'Bachelor of Business Studies Honours in Marketing',
    'Bachelor of Divinity Honours',
    'Bachelor of Education Honours in Mathematics',
    'Bachelor of Health Services Management Honours',
    'Bachelor of Laws Honours (LLB)',
    'Bachelor of Medical Laboratory Sciences Honours',
    'Bachelor of Science Honours Degree in Agriculture with Education',
    'Bachelor of Science Honours in Agribusiness Management',
    'Bachelor of Science Honours in Agriculture and Community Development',
    'Bachelor of Science Honours in Artificial Intelligence',
    'Bachelor of Science Honours in Computer Information Systems',
    'Bachelor of Science Honours in Computer Science',
    'Bachelor of Science Honours in Counselling',
    'Bachelor of Science Honours in Economics',
    'Bachelor of Science Honours in Environmental Studies and Natural Resources Management',
    'Bachelor of Science Honours in Human Resources Management',
    'Bachelor of Science Honours in Industrial Sociology and Labour Studies',
    'Bachelor of Science Honours in Information Technology',
    'Bachelor of Science Honours in International Relations',
    'Bachelor of Science Honours in Natural Resources Management',
    'Bachelor of Science Honours in Public Administration and Administration',
    'Bachelor of Science Honours in Software Engineering',
    'Bachelor of Science in Social Work',
    'Bachelor of Science with Education in Business and Commerce Honours Degree Programme BScEd (Hons)',
    'Bachelor of Social Sciences Honours in Psychology'
  ];
  var POSTGRADUATE = [
    'Doctor of Philosophy in Child Rights and Childhood Studies',
    'Doctor of Philosophy in Intellectual Property',
    'Doctor of Philosophy in Peace Leadership and Governance',
    'Doctor of Philosophy in Public Health',
    'Executive Master of Business Administration',
    'Master in Human Rights, Peace & Development',
    'Master in Intellectual Property',
    'Master in Peace, Leadership and Governance',
    'Master in Public Policy and Governance',
    'Master in Public Sector Management',
    'Master of Arts in Religious Studies',
    'Master of Education Degree in Educational Technology (MEd Et)',
    'Master of Education in Educational Leadership, Management and Development',
    'Master of Philosophy Degree in Public Health',
    'Master of Philosophy in Crop Production / Animal Science / Agribusiness and Natural Resources',
    'Master of Public Health',
    'Master of Science in Agribusiness',
    'Master of Science in Applied Accounting',
    'Master of Science in Child Rights and Childhood Studies',
    'Master of Science in Computer Science',
    'Master of Science in Crop Production',
    'Master of Science in Entrepreneurship, Innovation and Creativity',
    'Master of Science in International Relations and Diplomacy',
    'Master of Science in Migration, Citizenship and Refugee Protection',
    'Master of Science in Organisational Psychology',
    'Master of Social Science in Development Studies',
    'Master of Theological Studies',
    'Post Graduate Diploma in Education',
    'Post-Basic Bachelor of Science Honours in Nursing',
    'Postgraduate Certificate in Theological and Religious Research'
  ];
  // first matching rule wins
  var RULES = [
    [/Agri|Crop|Animal Science|Natural Resources|Environmental/i, 'Faculty of Agriculture and Natural Resources'],
    [/Educat|B\.ECE|BScEd/i, 'Faculty of Education'],
    [/Divinity|Theolog|Religio/i, 'Faculty of Theology'],
    [/Health|Nursing|Medical/i, 'Faculty of Health Sciences'],
    [/Peace|Governance|Public Policy|Public Sector|Migration|Child Rights|International Relations|Diplomacy|Human Rights/i, 'Institute of Peace, Leadership and Governance'],
    [/Laws|LLB|Intellectual Property/i, 'Faculty of Law'],
    [/Computer|Information|Artificial|Software/i, 'Faculty of Science and Technology'],
    [/Business|Management|Accounting|Marketing|Human Resources|Entrepreneurship|Public Administration|Economics/i, 'Faculty of Management and Administration']
  ];
  function facultyOf(name) { for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(name)) return RULES[i][1]; return 'Faculty of Humanities and Social Sciences'; }
  var list = [];
  UNDERGRADUATE.forEach(function (n) { list.push({ name: n, level: 'Undergraduate', faculty: facultyOf(n) }); });
  POSTGRADUATE.forEach(function (n) { list.push({ name: n, level: 'Postgraduate', faculty: facultyOf(n) }); });
  if (typeof module !== 'undefined' && module.exports) module.exports = list; else root.PROGRAMMES = list;
})(typeof window !== 'undefined' ? window : this);
