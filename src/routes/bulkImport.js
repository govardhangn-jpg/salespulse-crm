const express = require('express');
const router = express.Router();

// ── 251 customers from CUSTOMER_DETAILS.xlsx ──────────
const BULK_CUSTOMERS = [
  {
    "name": "MAINI PRECISION PRODUCTS LTD., 5A",
    "address": "5A, Bommasandra Industrial Area, Bangalore - 560099",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560099"
  },
  {
    "name": "AQUASUB ENGINEERING UNIT V - FOUNDRY",
    "address": "SF No 254/1, 258/1, Kallapayam Post, Ondipudur Via, Coimbatore - 641201",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641201"
  },
  {
    "name": "ISC CNC LLP",
    "address": "No 337-A, Netaji Nagar, Nanjundapuram, Ramanathapuram, Coimbatore - 641036",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641036"
  },
  {
    "name": "WALLOYS FASTENERS INDIA PVT LTD.,",
    "address": "Plat No 2, Near SBI, Tarihal Industrial Area, Tarihal, Hubli - 580026",
    "city": "Hubli",
    "state": "Karnataka",
    "pinCode": "580026"
  },
  {
    "name": "BAJAJSONS LTD.,",
    "address": "# 31, M.I.D.C., Satpur, Nashik - 422007, Ph No: 0253-6610020-21, 2365761, 2365771",
    "city": "Nashik",
    "state": "Maharashtra",
    "pinCode": "422007"
  },
  {
    "name": "UB CHEMI TECHNOLOGIES",
    "address": "No 23, PSG Estate Colony, Peelamedu, Coimatore - 641 004, Cont No: 9994987611,9443636350",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "000000"
  },
  {
    "name": "SUNDRAM FASTENERS LIMITED - SEZ PLANT III",
    "address": "SFL-SEZ, Plot No AA1, Central Avenue, Mahindra World City Post, Chengalpet, Kancheepuram District - 603004",
    "city": "Kancheepuram",
    "state": "Tamil Nadu",
    "pinCode": "603004"
  },
  {
    "name": "HARIHAR ALLOYS (P) LTD-FORGING DIVISION",
    "address": "SF No 81/82, Vellore Village, Illupur Taluk, Viralimalai - 621316",
    "city": "Viralimalai",
    "state": "Tamil Nadu",
    "pinCode": "621316"
  },
  {
    "name": "ARIHANT METALS & EXTRUDED PVT LTD",
    "address": "No 9-L, Yarandahally , Bommasandra 1st Phase, Anekal Taluk, Bommsandra Indl Area, Bangalore - 560099",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560099"
  },
  {
    "name": "ALLISON TRANSMISSION INDIA PVT LTD.,",
    "address": "Plot No A-21, Sipcot Industrial Growth Center/park, Oragadam, Sriperumpudur Taluk, Kanchipuram District - 602105",
    "city": "Kancheepuram",
    "state": "Tamil Nadu",
    "pinCode": "602105"
  },
  {
    "name": "MAINI PRECISION PRODUCTS LIMITED., PEENYA",
    "address": "B-165 & 166, 3rd Cross, 1st Stage, Peenya Industrial Area, Bangalore - 560058",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560058"
  },
  {
    "name": "KEMS FORGINGS LTD - UNIT IV",
    "address": "NO 63, Sipcot Inustrial Complex, Hosur - 635126",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pinCode": "635126"
  },
  {
    "name": "PRECISION CAMSHAFTS LIMITED.,",
    "address": "No D-5, D-6, D-7/1, M.I.D.C, Chincholi, Solapur - 413255, Cont No: 9168646531/32/33",
    "city": "Solapur",
    "state": "Maharashtra",
    "pinCode": "413255"
  },
  {
    "name": "ULTIMATE ALLOYS PVT LTD.,",
    "address": "Trichy Road, Sulur , Coimbatore - 641402",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641402"
  },
  {
    "name": "PP ENTERPRISES",
    "address": "NO 528,Sector - 15, Part - 1, Near Jain Mandir, Gurgaon - 122001, Cont No: 9911277776",
    "city": "Gurgaon",
    "state": "Haryana",
    "pinCode": "122001"
  },
  {
    "name": "SUNDRAM FASTENERS LTD., SEZ-SRI CITY",
    "address": "No 1855, Peepul Boulevard, Sez Unit - Sri City, Chittoor - 517646",
    "city": "Chittoor",
    "state": "Andhra Pradesh",
    "pinCode": "517646"
  },
  {
    "name": "SAA AB ENGINEERING PVT LTD,. PLANT-3",
    "address": "# 94,95,96,/KIADB Industrial Area, 4th Phase Bommasandra,Jigani Link Road, Bengaluru - 560099",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560099"
  },
  {
    "name": "SAA AB ENGINEERING PVT LTD., PLANT-6",
    "address": "Plot No 146/B, Survey No 284 & 319, Bommasandra Indl Estate, Bangalore - 560099",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560099"
  },
  {
    "name": "AESTUS INDUSTRIES",
    "address": "No 29/2A, 5/1, Nanja Reddy Layout, Jigani,Yarandahalli, Bengaluru - 560105",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560105"
  },
  {
    "name": "SOMIC INDIA PRIVATE LIMITED (CHENNAI)",
    "address": "No 35, Thiruvankarunai Road, Kunnam Village, Sriperambudur Taluk, Kancheepuram - 631604",
    "city": "Kancheepuram",
    "state": "Tamil Nadu",
    "pinCode": "631604"
  },
  {
    "name": "RAREWALA STEEL & ALLOYS PVT LTD.,",
    "address": "# 494, Sompura Industrial Area, Dobaspet, Bangalore - 562111",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562111"
  },
  {
    "name": "SAMRAT FORGINGS LTD., UNIT I",
    "address": "Village Ghollu Majra,Derabassi, Dist - Mohali - 140506",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "140506"
  },
  {
    "name": "KEMS AUTO COMPONENTS LTD.,",
    "address": "No 32/A, KIADB Industrial Area, Hosakote, Bangalore - 562114",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562114"
  },
  {
    "name": "AUTO INTERNATIONAL (INDIA) PVT.LTD.,",
    "address": "G Floor, A27/2, Sipcot Industrial Growth Centre, Mathur Village, Oragadam, Sriperumbudur, Kanchipuram - 602105",
    "city": "Kancheepuram",
    "state": "Tamil Nadu",
    "pinCode": "602105"
  },
  {
    "name": "GISHNU GEARS PVT LTD.,",
    "address": "SF No 796, Door No 3/217K, Avinashi Road, Near Hotel Le Meridian, Neelambur, Coimbatore - 641062",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641062"
  },
  {
    "name": "GALVANO TRACK SOLUTIONS PVT.LTD.,",
    "address": "No 148A , Industrial Suburb , 1st Stage, Yeshwanthpur, Bangalore - 560022",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560022"
  },
  {
    "name": "RANE ( MADRAS) LIMITED.,",
    "address": "No 79/84, Hootagalli Industrial Area, Mysore - 570018",
    "city": "Mysuru",
    "state": "Karnataka",
    "pinCode": "570018"
  },
  {
    "name": "WIPRO ENTERPRISES PVT.LTD., II",
    "address": "(Div: Wipro Infrastructure Engineering), Plot No 126 to 131, Bangalore Aerospace Sez Park, Devanahalli, Bangalore - 562129",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562129"
  },
  {
    "name": "HEROTEK STEEL & ALLOYS.,",
    "address": "Sf No 3/1, Chikkarampalayam Village, Mettupalayam, Karamadai, Coimbatore - 641104",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641104"
  },
  {
    "name": "LEONIX",
    "address": "No 4064A, Srinivasanagar Main Road, Puzhudhivakkam, Chennai - 600091",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pinCode": "600091"
  },
  {
    "name": "SRI ENERGY VALVES PRIVATE LIMITED",
    "address": "SF No. 115/4A, Vadugapatty Village, Viralimalai Taluk, Pudukottai - 621316, Cont No: 9942904612",
    "city": "Viralimalai",
    "state": "Tamil Nadu",
    "pinCode": "621316"
  },
  {
    "name": "SANDFITS FOUNDRIES PVT LTD - UNIT - I",
    "address": "SF No 200/1A, Trichy Road, Ravathur Pirivu, Kannampalayam (Po), Coimbatore - 641402",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641402"
  },
  {
    "name": "PUNCH RATNA FASTNERS PVT LTD., UNIT-III",
    "address": "7th-8th Km Stone, Jind Road, Vill & Po Titoli, Rohtak - 124001, Cont No:  09896689577",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "124001"
  },
  {
    "name": "SHIVAM AUTOTECH LTD. SATL-BANGALORE",
    "address": "Plot No 98/99, Vemagal Industrial Area, Kolar - 563102",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "563102"
  },
  {
    "name": "INDO-MIM LIMITED",
    "address": "# 45 (P) , KIADB Industrial Area, Hosakote, Bangalore - 562114",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562114"
  },
  {
    "name": "VINIR ENGINEERING LIMITED - UNIT 2",
    "address": "Plot No 139 -140, Sipcot Industrial Area, Phase -1, Hosur - 635126",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pinCode": "635126"
  },
  {
    "name": "KOSO INDIA PRIVATE LIMITED",
    "address": "No 1/80, Telugupalayam Road, Pillayappampalayam Po, Annur, Coimbatore - 641653",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641653"
  },
  {
    "name": "SAA AB ENGINEERING PVT LTD., PLANT-5",
    "address": "Sy No 295/1A, 295/1B, Thiyagarasanapalli Main Road, Shoolagiri - 635117, Krishnagiri Distict",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "635117"
  },
  {
    "name": "KEMS AUTO COMPONENTS LTD - UNIT II",
    "address": "No 63, SIPCOT Industrial Complex, Hosur - 635126",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pinCode": "635126"
  },
  {
    "name": "HANSA-FLEX (IFP) INDIA PVT LTD.,",
    "address": "Plot No PAPV95, MIDC Chakan Industrial Area, Village Vasuli, Taluka - Khed, Pune - 410501",
    "city": "Pune",
    "state": "Maharashtra",
    "pinCode": "410501"
  },
  {
    "name": "GALA PRECISION ENGINEERING LTD.,SPR",
    "address": "No G-18/2, Vallam Vadagal , SIPCOT Industrial Park, Sriperambudur, Kancheepuram - 602105",
    "city": "Kancheepuram",
    "state": "Tamil Nadu",
    "pinCode": "602105"
  },
  {
    "name": "VINIR ENGINEERING LIMITED - UNIT 3",
    "address": "Sy No 245/1, 253/2A, Kalukondapalli Village, Denkanikottai Taluk, Hosur-Thally Road, Krishnagiri Dist - 635119",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pinCode": "635119"
  },
  {
    "name": "FASTENERS ENGINEERING PVT.LTD.,",
    "address": "#  55/2, Ayyappanagar Main Road, Hoodi, Mahadevapura Post, Bangalore - 560048",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560048"
  },
  {
    "name": "VINIR ENGINEERING LIMITED - UNIT 1",
    "address": "Plot No 102-104, Bommasandra Industrial Area, Hosur Road, Bengaluru - 560099",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560099"
  },
  {
    "name": "DNC EQUIPMENTS & SERVICES",
    "address": "First Floor, Office No 29, Shubh Complex, Gondal National Highway, Shapar - Veraval, Rajkot - 360024",
    "city": "Rajkot",
    "state": "Gujarat",
    "pinCode": "360024"
  },
  {
    "name": "PUNCH RATNA FASTENERS PVT LTD., UNIT II",
    "address": "Plot No B-34 & B-15, SIPCOT Industrial Park, Oragadam, Village Eraiyur, Taluk-Sriperambudur, Kancheepuram - 602105",
    "city": "Kancheepuram",
    "state": "Tamil Nadu",
    "pinCode": "602105"
  },
  {
    "name": "UNIMECH INDUSTRIES PRIVATE LIMITED.,",
    "address": "Foundry Division, SF No 76 & 80, Thirumalayampalayam Post, Coimbatore - 641105",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641105"
  },
  {
    "name": "CRAFTSMAN AUTOMATION LIMITED-UNIT3",
    "address": "123/4, Sangothipalayam Road, Arasur Post, Coimbatore - 641407",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641407"
  },
  {
    "name": "SUNDRAM FASTENERS LIMITED, SEZ UNIT II",
    "address": "SFL-SEZ II, Plot No AA1, Central Avenue, Mahindra World City Post, Chengalpet, Kancheepuram - 603004",
    "city": "Kancheepuram",
    "state": "Tamil Nadu",
    "pinCode": "603004"
  },
  {
    "name": "INVESTMENT & PRECISION CASTINGS LTD.,",
    "address": "Nari Road, Bhavnagar, Gujrat - 364006",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "364006"
  },
  {
    "name": "MACBROUT ENGINEERING PVT LTD,.",
    "address": "No 390/H, Survey No 120/1B, San Jose Areal, Po: Curtorim, Margao, Goa - 403 709",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "000000"
  },
  {
    "name": "INDO-MIM LIMITED., RENIGUNTA PLOT NO 46",
    "address": "(Formerly Indo-Mim Private Limited), Plot No 46, APIIC Industrial Park, Gajulamandyam, Athur Post, Tirupati, Renigunta - 517520",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "517520"
  },
  {
    "name": "INDO-MIM LIMITED., RENIGUNTA, 62B",
    "address": "(Formerly Indo-Mim Private Limited), 62B (Part 1 & 2) , APIIC Indl Park , Gajulamandyam, Tirupati, Renigunta - 517520",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "517520"
  },
  {
    "name": "HIGHWAY ROOP PRECISION TECHNOLIGIES LTD.,NUH MEWAT",
    "address": "No 19, 20, 30, 31 & 210, Rozkameo Indl Area, Nuh Mewat - 122107",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "122107"
  },
  {
    "name": "SUMANGAL FORGINGS PVT LTD.,",
    "address": "Survey No 155, SIDC Road, Village - Veraval ( Shapar), Rajkot District - 360024",
    "city": "Rajkot",
    "state": "Gujarat",
    "pinCode": "360024"
  },
  {
    "name": "V.R. FOUNDRIES",
    "address": "SF No 478/1&2,  Ponnandampalayam, Kaniyur Village, Sulur Taluk, Coimbatore - 641004",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641004"
  },
  {
    "name": "HITEN FASTENERS PRIVATE LIMITED - VIII",
    "address": "Plot No 117, 118,121,122, KIADB Industrial Area, Narsapur, Gadag - 582103",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "582103"
  },
  {
    "name": "ADL.ED /M&C , RAIL WHEEL FACTORY",
    "address": "1st Main, Doddaballapur Road, Yelahanka, Bangalore - 560064",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560064"
  },
  {
    "name": "HL MANDO ANAND INDIA PVT.LTD.,",
    "address": "No S1A/S5, SIPCOT Industrial Park, Vengadu, Pillaipakkam Post, Sriperambudur - 602105",
    "city": "Tamil Nadu",
    "state": "Tamil Nadu",
    "pinCode": "602105"
  },
  {
    "name": "BRIGHT TECH INDSTRIALS INDIA PVT LTD., HOSAPETE",
    "address": "1st Floor, 6th Ward, Near Raghavendra Swamy Temple, Mariyammanahalli, Hosapete - 583222",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "583222"
  },
  {
    "name": "HI-TECH MARKETING & SERVICES",
    "address": "Sco-6, 2nd Floor, City Plaza, Haibowalkalan, Ludhiana - 141001, Tel No: 09501060865/9872606660",
    "city": "Ludhiana",
    "state": "Punjab",
    "pinCode": "141001"
  },
  {
    "name": "FLOWSERVE INDIA CONTROLS PVT LTD.,",
    "address": "Plot#4,1A, Road No 8,EPIP, Whitefield , Bangalore - 560066, Tel # +91-80-40146433",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560066"
  },
  {
    "name": "SUMANGAL CASTINGS PVT LTD.,",
    "address": "Veraval ( Shapar ), Rajkot - 360024 ., Gujrat",
    "city": "Rajkot",
    "state": "Gujarat",
    "pinCode": "360024"
  },
  {
    "name": "SPARK ENGINEERING SERVICES",
    "address": "# 26, Ganesh Nagar, MGR Street , Chettipunniyam, Mahindra World City, Singaperumal Koil, Chennai - 603204",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pinCode": "603204"
  },
  {
    "name": "MUVIQ INDIA POWER TRANSMISSION PVT LTD.,",
    "address": "Plot No 12 & 13, Sector - 6 , IMT Manesar , Gurgaon - 122050",
    "city": "Gurgaon",
    "state": "Haryana",
    "pinCode": "122050"
  },
  {
    "name": "SUNSTAR PRECISION FORGE LIMITED.,",
    "address": "Plot No 12, Udyog Kendra , Ecotech - III , Gautam Buddha Nagar , Greater Noida - 201306",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "pinCode": "201306"
  },
  {
    "name": "GKN DRIVELINE (INDIA) LIMITED-ORA",
    "address": "Plot No B-13, SIPCOT Industrial Park, Oragadam, Sriperumbadur, Kancheepuram - 602105",
    "city": "Kancheepuram",
    "state": "Tamil Nadu",
    "pinCode": "602105"
  },
  {
    "name": "NSK BEARINGS INDIA PVT LTD.,(FORMERLY NISCO)",
    "address": "Plot No A2, SIPCOT Oragadam Growth Centre, Mathur Village, Sriperambudur, Chennai - 602105",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pinCode": "602105"
  },
  {
    "name": "NPR AUTO PARTS MANUFACTURING INDIA PVT LTD.,",
    "address": "Plot No 6-O to 6-P , Malur Industrail Area, 4th Phase, Hulimangala Hosakotevillage, Lakkur Hobli, Malur Taluk, Kolar - 563160",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "563160"
  },
  {
    "name": "SATYAY TECHNOLOGIES PVT LTD.,",
    "address": "Plot No 2781 , Road - I-2 , G.I.D.C. Indl Estate, Metoda , Rajkot - 360021",
    "city": "Rajkot",
    "state": "Gujarat",
    "pinCode": "360021"
  },
  {
    "name": "BHAVANI INDUSTRIES UNIT III",
    "address": "Plot No 8B, Electronics City  ( Phase -II East), Bangalore - 560100",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560100"
  },
  {
    "name": "SUNDRAM FASTENERS LTD., HOSUR",
    "address": "Cold Extrusion Plant, Harita, Hosur, Hosur, Krishnagiri Dist - 635109",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pinCode": "635109"
  },
  {
    "name": "KEMS FORGINGS LIMITED., UNIT - I",
    "address": "Plot No 35 - B, KIADB Industrial Area, Hosakote , Bangalore - 562114",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562114"
  },
  {
    "name": "INNOTECH INTEGRATION SERVICES PVT LTD.,",
    "address": "No 1 A, Rukmini Plaza, 3rd Floor, Srirampura Main Road, Madhuvana Layout, Srirampura, Mysore  - 570023",
    "city": "Mysuru",
    "state": "Karnataka",
    "pinCode": "570023"
  },
  {
    "name": "RANGSONS AEROSPACE PVT LTD.,",
    "address": "# 9, KIADB Industrial Area, Sy 35, Part 36 ,42, Belagola Hobli, Srirangapatna Mandya - 570401, (Nr Emerald Enclave , Hebbal Indl Area, Mysore - 570016",
    "city": "Mysuru",
    "state": "Karnataka",
    "pinCode": "570401"
  },
  {
    "name": "HAMPSON INDUSTRIES PVT LTD.,",
    "address": "Sy No 40/41/ , Thonachinakuppe, Kasaba Hobli, Nelamangala Taluk , Tumkur Road, Bangalore - 562123",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562123"
  },
  {
    "name": "KYOWA NATESAN SYNCHRO TECHNOLOGIES PVT LTD.,",
    "address": "No 221/2, Palanthandalam, Thirumudivakkam, Sriperambudur Taluk, Chennai - 600 044",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pinCode": "000000"
  },
  {
    "name": "MAINI PRECISION PRODUCTS LTD.,16B",
    "address": "NO 16-B, 1st Phase, Peenya Industrial Area, Bangalore - 560058",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560058"
  },
  {
    "name": "STEER ENGINEERING PVT LTD.,",
    "address": "# 2/85/3, S.F. No 112, Annur Road, Arasur Village, Coimbatore -641407",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641407"
  },
  {
    "name": "PUNCH RATNA FASTENERS PVT LTD., UNIT- I",
    "address": "# 7.4 KM Stone, Jind Road, VPO - Titoli, Rohtak - 124001",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "124001"
  },
  {
    "name": "BENAKA PERFECT SERVICES",
    "address": "25-B , Nidige Industrial Area, Machenahalli, Shivamogga - 577229",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "577229"
  },
  {
    "name": "CURTISS WRIGHT SURFACE TECHNOLOGIES INDIA PVT LTD",
    "address": "Plot No 80, Bommasandra Jigani Link Road, Industrial Area, Anekal Taluk, Bangalore - 560105",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560105"
  },
  {
    "name": "STARC (SITAR)",
    "address": "Vijinapura Road, Dooravani Nagar P.O., Bangalore - 560016",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560016"
  },
  {
    "name": "RR PRECISION ( INDIA) PVT LTD",
    "address": "Plot No 25/1, Tamaka Industrial Estate, Kolar - 563101",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "563101"
  },
  {
    "name": "PP ENTERPRISES",
    "address": "No 1099 , Sector 15, Part - 2, Near Jain Mandir, Gurgaon - 122001, Cont No: 9911277776",
    "city": "Gurgaon",
    "state": "Haryana",
    "pinCode": "122001"
  },
  {
    "name": "TRANS REPOWER ENGINEERING SERVICES INDIA PVT LTD",
    "address": "No 171/59, 24, 2nd Cross Street , Basaveshwara Layour, Bommasandra Indl Area, Bangalore - 560099",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560099"
  },
  {
    "name": "MAGMATIC NDT SYSTEMS",
    "address": "No 53, 4th Cross, 2nd Main Road, Lalbahadur Shastri Nagar, 10th Block, Anjanapura Extension,10th Block, Bangalore - 560108",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560108"
  },
  {
    "name": "ASHTA LINERS PVT LTD.,",
    "address": "RS No 334/ 2 B, Sangli Islampur Road, Ashta Tal. Walwa Dist, Sangli - 416301",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "416301"
  },
  {
    "name": "VEL CASTINGS PRIVATE LIMITED - PLANT 1",
    "address": "S-40 , SIPCOT Industrial Complex, Phase III, Walaja Block, Ranipet - 632405",
    "city": "Ranipet",
    "state": "Tamil Nadu",
    "pinCode": "632405"
  },
  {
    "name": "HIGHWAY ROOP PRECISION TECHNOLOGIES LTD.,",
    "address": "(Formerly Known As Roop Automotives Ltd), Plot No G31 & H22, 9th Cross Street, SIPCOT Indl, Park Vallam Vadagal, Palnallur (V) , Echoor Post, Sriperambudur Taluk, Kanchipuram - 631604",
    "city": "Kancheepuram",
    "state": "Tamil Nadu",
    "pinCode": "631604"
  },
  {
    "name": "PHOENIX FORGE PVT LTD.,",
    "address": "Plot No 21, Road No 25A, Intesected Road No -5, Vasanthanarasapura Phase 2, Kora Industrial Area, Tumkur - 572128",
    "city": "Tumakuru",
    "state": "Karnataka",
    "pinCode": "572128"
  },
  {
    "name": "PEEKAY STEEL CASTINGS PRIVATE LIMITED.,",
    "address": "Plot No 40, APIIC Industrial Park, Gollapuram, Sathya Sai ( Dist), Hindupur - 515211",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "515211"
  },
  {
    "name": "NEWTECH FASTENERS",
    "address": "# B-64, & C-70, Devasandra Industrial Estate, Mahadevapura Post, Bengaluru - 560048",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560048"
  },
  {
    "name": "CIE AUTOMOTIVE INDIA LTD., PLANT 2",
    "address": "No 98L & M  , KIADB Industrial Area, Phase II , Jigani , Bengaluru - 560105, Tel : +91-80-29606041/71/81/91",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560105"
  },
  {
    "name": "CIE AUTOMOTIVE INDIA LIMITED-P4",
    "address": "# 1/178, Pollachi Main Road, Ganesh Nagar, Malumachampatti , Coimbatore - 641021",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641021"
  },
  {
    "name": "CIE AUTOMOTIVE INDIA LTD., PLANT 6",
    "address": "Plot No 86(M&N) , KIADB Indl Area, Jigani 1st Phase, Bangalore - 560105",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560105"
  },
  {
    "name": "CIE HOSUR LIMITED.,",
    "address": "Plot No 60, Sipcot Industrial , Hosur, Krishnagiri District, Hosur - 635126",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pinCode": "635126"
  },
  {
    "name": "VIJAYA METAL FINISHERS",
    "address": "# 365, 10th Cross, IV Phase, Peenya Industrial Area, Bangalore - 560058",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560058"
  },
  {
    "name": "BRIGHT TECH INDUSTRIALS INDIA PVT LTD., TADPATRI",
    "address": "Flat No 3, 1143 3GVP Colony, Tadipatri Town & Mandal, Tadpatri, Anantapuram - 515411",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "515411"
  },
  {
    "name": "DAKSHIN FOUNDRY PVT LTD",
    "address": "Plot No 28, B to H , KIADB Industrial Area, Hosakote, Bangalore - 562114",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562114"
  },
  {
    "name": "CRAFTSMAN AUTOMATION LTD - UNIT 1 (KOTHAVADI)",
    "address": "SF No 77/1 , 77/2, 80/1 , Kothavadi Village , Kinathukadavu Taluk, Coimbatore - 642109",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "642109"
  },
  {
    "name": "VERTEX TECHINC PRIVATE LIMITED.,",
    "address": "B1-1960/19, Purvanchal Royal City, Sector Chi -5, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh - 201310",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "pinCode": "201310"
  },
  {
    "name": "VIBRANT NDT SERVICES PVT LTD",
    "address": "107,111 SIdco Aiema Towers 1st Main, Road, Ambathur Indl Estate, Chennai - 600058",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pinCode": "600058"
  },
  {
    "name": "AESTUS UDYOG",
    "address": "Plot No Q7, KSSIDC Industrial Area, 2nd Stage, Jigani, Anekal Taluk, Bangalore - 560105",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560105"
  },
  {
    "name": "HI-TECH ENTERPRISES",
    "address": "Sco-6, 2nd Floor, City Plaza, Haibowal Kalan, Ludhiana -141001",
    "city": "Ludhiana",
    "state": "Punjab",
    "pinCode": "141001"
  },
  {
    "name": "ICONIC CASTINGS PVT LTD.,",
    "address": "Plot No 149, KATP, Village - Tardal, Taluka - Hatkanangale, Kolhapur - 416121",
    "city": "Kolhapur",
    "state": "Maharashtra",
    "pinCode": "416121"
  },
  {
    "name": "HIGHWAY ROOP PRECISION TECHNOLIGIES LTD.,NUH MEWAT",
    "address": "( Formerly Known As Roop Automotives Ltd), No 19,20,22,28,30,31,209 & 210 , Rozkameo Indl Area, Nuh Mewat - 122107",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "122107"
  },
  {
    "name": "INDO SHELL CAST PRIVATE LIMITED., UNIT-II",
    "address": "S.F. No 349/4, 336/4, Malumachampatti, Coimbatore - 641050",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641050"
  },
  {
    "name": "SHEETAL ENTERPRISES",
    "address": "Plot No 99, Krishna Colony,Gali No 5 ,6, Sector 25, Faridabad - 121004",
    "city": "Faridabad",
    "state": "Haryana",
    "pinCode": "121004"
  },
  {
    "name": "MAINI PRECISION PRODUCTS LIMITED., 122-A",
    "address": "122-A, C,D & E, Bommasandra Industrial Area, Bangalore - 560099",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560099"
  },
  {
    "name": "XLP ENGINEERS PRIVATE LIMITED.,",
    "address": "Plot No 140 , Industrial Area , Rozka Meo , Sohna , Gurgaon - 122103",
    "city": "Gurgaon",
    "state": "Haryana",
    "pinCode": "122103"
  },
  {
    "name": "HAVEUS AEROTECH INDIA LTD",
    "address": "Site No 62, Kalpatharu Farma, Chikkasanne Village, Kasaba Hobli, Devanahalli Taluk, Bengaluru - 562110",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562110"
  },
  {
    "name": "HIGHWAY ROOP PRECISION TECHNOLOGIES LTD ., MANESAR",
    "address": "Plot No 439 & 440, Sector 8, IMT Manesar, Gurugram - 122050, Tel No: 0124-4959800",
    "city": "Gurgaon",
    "state": "Haryana",
    "pinCode": "122050"
  },
  {
    "name": "SOMIC INDIA PRIVATE LIMITED (GURGAON)",
    "address": "Post Box No 38, Village- Begumpur Khatola, Gurgaon - 122001",
    "city": "Gurgaon",
    "state": "Haryana",
    "pinCode": "122001"
  },
  {
    "name": "KANNAPPA FORGINGS",
    "address": "No G11, Sipcot Industrial Park, Mambakkam Village, Sriperambudur - 602106, Kancheepuram Dist",
    "city": "Kancheepuram",
    "state": "Tamil Nadu",
    "pinCode": "602106"
  },
  {
    "name": "HARIHAR ALLOYS (P) LTD",
    "address": "SF No 80/61, 80/62, 80/68, Vellore Road, Illupur Taluk, Viralimalai, Pudukottai - 621316",
    "city": "Viralimalai",
    "state": "Tamil Nadu",
    "pinCode": "621316"
  },
  {
    "name": "ILJIN AUTOMOTIVE PVT LTD.",
    "address": "No B1 & B2 , Sipcot Industrial Park, Irrungattukottai, Sriperambudur Taluk, Kanchipuram Dist - 602117",
    "city": "Kancheepuram",
    "state": "Tamil Nadu",
    "pinCode": "602117"
  },
  {
    "name": "AMEX ALLOYS PVT LTD., ( INVEST CAST DIVISION)",
    "address": "SF No 293/1A, Kunnathur Pudur (Po) , Sathy Road, Coimbatore - 641107",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641107"
  },
  {
    "name": "AMEX ALLOYS PVT LTD., ( MC SHOP DIVISION)",
    "address": "257/1AI , Sathy Road, Kunnathupudhur , Coimbatore - 641107",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641107"
  },
  {
    "name": "INDO SHELL CAST PRIVATE LIMITED., UNIT-1",
    "address": "No A14, SIDCO Industrial Estate, Coimbatore - 641021, Tel No: 0422-3041600",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641021"
  },
  {
    "name": "SHREE SHAKTHI HEAT TREATERS",
    "address": "# SPL 10, KSSIDC Industrial Estste, IInd Stage, Jigani Link Road, Bommasandra, Bengaluru - 560099",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560099"
  },
  {
    "name": "HIGHWAY ROOP INDUSTRIES LTD.,",
    "address": "Gat No 611/1/1, Kuruli, Taluka Khed, MIDC Chakan , Phase 3 Road, Pune - 410501",
    "city": "Pune",
    "state": "Maharashtra",
    "pinCode": "410501"
  },
  {
    "name": "BRS PRECISION MANUFACTURING PVT LTD.,",
    "address": "1-A, 1st Phase, Survey No 70, Harohalli Industrial Area, Kanakapura Taluk, Ramangar District - 562112",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "562112"
  },
  {
    "name": "ROLLON HYDRAULICS PVT LTD",
    "address": "No 271, 4th Phase, 8th Cross, Peenya Indl Area, Bangalore - 560058",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560058"
  },
  {
    "name": "PIONEER INSPECTION SOLUTION INDA PVT LTD.,",
    "address": "No 106, HIG , 1st Floor, 2nd Cross, Suryanagara Phase 1 , Anekal Road, Chandapura, Bangalore - 560081",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560081"
  },
  {
    "name": "PRAKASH METALLIC PVT LTD.,",
    "address": "Currency Tower, Unit No 6052, 6th Floor, VIP Road, Raipur - 492001",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "492001"
  },
  {
    "name": "UNIMECH INDUSTRIES PVT LTD., ( MACHINING DIVISION)",
    "address": "No 1/179, Pollachi Main Road, Malumachampatti Post, Coimbatore - 641050",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641050"
  },
  {
    "name": "BANSAL PRECISION FORGE PRIVATE LIMITED.,",
    "address": "Flat No 34-35, Jigani Bommasandra Link Road, Jigani Bommasandra Link Road Indl Area, Bengaluru - 560105",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560105"
  },
  {
    "name": "SCHAEFFLER INDIA LIMITED.,",
    "address": "Survey No - 950 , Rayakottah Road, Krishnagiri Dist, Hosur - 635109",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pinCode": "635109"
  },
  {
    "name": "AGNEY TECHNOCRATS LLP",
    "address": "D/112, Five Star M.I.D.C. Kagal, Kolhapur - 416 236",
    "city": "Kolhapur",
    "state": "Maharashtra",
    "pinCode": "000000"
  },
  {
    "name": "UMAA ENGINEERS",
    "address": "Plot No 183, Thanthai Periyar Salai, Kumaran Nagar, Semmanchari, Chennai - 600119",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pinCode": "600119"
  },
  {
    "name": "VEE TEE AUTO MANUFACTURING PVT LTD.,",
    "address": "Bhiwadi Plant - RJ01 , PLOT NO A146 E , Phase 1, RIICO Industrial Area, Bhiwadi ,Alwar - 301019",
    "city": "Alwar",
    "state": "Rajasthan",
    "pinCode": "301019"
  },
  {
    "name": "SANDFITS FOUNDRIES PVT LTD - UNIT IIIA",
    "address": "SF No 156/1A, Pappampatti Main Road, Peedampalli Post, Coimbatore - 641 016",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "000000"
  },
  {
    "name": "ARIHANT METALS & EXTRUDED PVT LTD.,PUNE",
    "address": "Part - II, Plot No IP-25, Village Nimgaon, Khed City, Rajgurunagar Khed, Pune - 410505, Mob No: 9845033015/9986929706",
    "city": "Pune",
    "state": "Maharashtra",
    "pinCode": "410505"
  },
  {
    "name": "JSW SEVERFIELD STRUCTURES LTD.,",
    "address": "Near 10 MT Gate, Beside JSW Cement Ltd-II, Vidyanagar Post, Village- Toranagallu, Sandur Taluk, Bellary - 583275, K/A Atten Mr. B Sridhar, Mob No: 7760972124",
    "city": "Ballari",
    "state": "Karnataka",
    "pinCode": "583275"
  },
  {
    "name": "BIG CASTINGS PVT LTD.,",
    "address": "Plot No 75, KIADB Industrial Estate, Honga, Belgaum - 591113",
    "city": "Belagavi",
    "state": "Karnataka",
    "pinCode": "591113"
  },
  {
    "name": "V.R. FOUNDRIES",
    "address": "SF No 478/1&2,  Ponnandampalayam, Kaniyur Village, Sulur Taluk, Coimbatore - 641659",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641659"
  },
  {
    "name": "PASHIN FORGE PVT LTD.,",
    "address": "No 474, Manjusar G.I.D.C. Estate, Village - Manjsar, Taluka - Savli, Baroda - 391775",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "391775"
  },
  {
    "name": "MUKUND SUMI SPECIAL STEEL LTD.,",
    "address": "Kanakapura Village, Ginigera, Hosapet Road, Koppal - 583228",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "583228"
  },
  {
    "name": "SRI RANGANATHAR VALVES (P) LTD.,",
    "address": "7/109, Thennampalayam Pirivu, Arasur Poast, Coimbatore - 641407, Ph No: +91 -422-3528100",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641407"
  },
  {
    "name": "INTEGRA AUTOMATION PVT.LTD.,UNIT - IV",
    "address": "SF No 238 , Kurunalli Palayam Village, Kinathukadavu Taluk, Coimbatore - 642120",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "642120"
  },
  {
    "name": "BHARAT HEAVY ELECTRICALS LIMITED.,",
    "address": "Solar Business Division, IISC , C.N.R. Rao Circle , Malleswaram, Bangalore - 560012",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560012"
  },
  {
    "name": "RANE ENGINE VALVE LTD., PLANT 2",
    "address": "Plot No 68-77, Industrial Estate, Medchal - 501401",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "501401"
  },
  {
    "name": "GALVANO CASTINGS PVT LTD.,",
    "address": "No 549, 14th Cross, 4th Phase, Peenya Industrial Area, Bengaluru - 560058",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560058"
  },
  {
    "name": "NETALKAR POWER TRANSMISSION., PLANT 2",
    "address": "Sy No 350, Khanapur Road, Udyambag, Belagavi - 590008",
    "city": "Belagavi",
    "state": "Karnataka",
    "pinCode": "590008"
  },
  {
    "name": "ALLIAGE METAL CASTINGS PVT LTD.,",
    "address": "No 182, Industrial Suburb , Peenya 3rd Phase, Bangalore - 560058",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560058"
  },
  {
    "name": "NEW RANDHIR PRESS TOOLS",
    "address": "Plot No 397, Sector - 24 , Faridabad - 121005",
    "city": "Faridabad",
    "state": "Haryana",
    "pinCode": "121005"
  },
  {
    "name": "VARSHA TECHNOLOGIES",
    "address": "No 125/6-9, Eliyambedu Village, Ponneri Taluk, Thiruvallur District - 601204, Mob No: 984108766",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "601204"
  },
  {
    "name": "WOOSU AUTOMOTIVE INDIA PVT LTD.,",
    "address": "No 130, Narasingapuram Village, Thiruvallur Taluk & District, Thiruvallur - 631402",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "631402"
  },
  {
    "name": "GENAU EXTRUSIONS PVT LTD., UNIT - 1",
    "address": "Site No 1, SIPCOT Industrial Complex, Phase II, Hosur - 635109, Ph No: 04344 260660/444/777",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pinCode": "635109"
  },
  {
    "name": "NETMECH ENGINEERING PVT LTD.,",
    "address": "Plot No 01 to 05 & 18 to 22, Sector K Phase II, Parvati Co-Op  Industrial Estate Ltd, Yadrav, Tal-Shirol , Kolhapur - 416146",
    "city": "Kolhapur",
    "state": "Maharashtra",
    "pinCode": "416146"
  },
  {
    "name": "SITAS-NDT ENGINEERS PVT LTD.,",
    "address": "C72, III Stage, Peenya Indl Area, Bengaluru - 560058",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560058"
  },
  {
    "name": "GKN DRIVELINE ( INDIA) LTD., PUNE",
    "address": "Plot No 4, Village Lonikand, Taluka - Haveli, Pune - 412216",
    "city": "Pune",
    "state": "Maharashtra",
    "pinCode": "412216"
  },
  {
    "name": "BEST HEAT TREATMENT SERVICES",
    "address": "No 53, Sidco Industrial Estate, Coimbatore - 641 021",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "000000"
  },
  {
    "name": "SIMJEN NDT SOLUTIONS LLP",
    "address": "Bilekalli 5 , UB Halli , Chikkamagaluru - 577168",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "577168"
  },
  {
    "name": "GRAPHITE INDIA LIMITED",
    "address": "(Powmex Steels Division ), At-Turla, P.O Jagua, P.S.: Titilagarh, Dist Bolangir - 767066",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "767066"
  },
  {
    "name": "DHARMASASTHA INDUCTION TECHNOLOGY.,",
    "address": "Door No 199/24A , Survey No 528/87 , Basaweswaran Nagar , Sipcot Phase II, Mooranapalli (V) , Krishnagiri (D), Hosur - 635109",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pinCode": "635109"
  },
  {
    "name": "NIDEC INDIA PRECISION TOOLS LTD.,",
    "address": "(Formerly Mitsubishi Heavy Industries India, -Precision Tools Ltd), No 2, SIPCOT Industrial Complex, Renipet - 632403",
    "city": "Tamil Nadu",
    "state": "Tamil Nadu",
    "pinCode": "632403"
  },
  {
    "name": "TRANCO ASSOCIATES",
    "address": "No 2/1123-11 , 9th Cross, Mookandapalli , Krishnagiri (D), Hosur - 635126",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pinCode": "635126"
  },
  {
    "name": "JSS AVIATION ENGG..&MAINTENANCE PVT LTD.,",
    "address": "No C-56, Sector - 88, GB Nagar, Noida - 201301",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "pinCode": "201301"
  },
  {
    "name": "AMMARUN FOUNDRIES",
    "address": "SF No 80/6A, Rathinagiri Road, Vilankurichi Post, Coimbatore - 641035",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641035"
  },
  {
    "name": "ENRX PRIVATE LIMITED.,",
    "address": "(Formerly Known As EFD Induction Pvt Ltd), Plot 43 & 44, KIADB Bengaluru Aerospace Park, KIADB Industrial Area, Bengaluru North Taluk, Bengaluru - 562129",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562129"
  },
  {
    "name": "MICRO TURNERS  - UNIT 3",
    "address": "MT03, 57-58 KM Milestone, Village- Binola, Delhi -Jaipur NH-08, Gurugram - 122413",
    "city": "Delhi",
    "state": "Delhi",
    "pinCode": "122413"
  },
  {
    "name": "SAKTHI FORGING INDUSTRY",
    "address": "No 95/72A , GNT Road, Madhavaram , Chennai - 600110",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pinCode": "600110"
  },
  {
    "name": "BHARAT HEAVY ELECTRICALS  LTD., RANIPET",
    "address": "Boiler Auxiliaries Plant, Ranipet - 632406",
    "city": "Ranipet",
    "state": "Tamil Nadu",
    "pinCode": "632406"
  },
  {
    "name": "SHAILESH FORGE PRIVATE LIMITED.,",
    "address": "B/H RK University, Kasturbadham-Gadhka Road, RS No 144/P2 , Bhavnagar Road, Kasturbadham (V), Gadhka ,Rajkot - 360020",
    "city": "Rajkot",
    "state": "Gujarat",
    "pinCode": "360020"
  },
  {
    "name": "SANTAKRUPA METALS",
    "address": "No 305/3 , Chitra GIDC , Bhavnagar , Gujarat - 364004",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "364004"
  },
  {
    "name": "EPPINGER TOOLING ASIA PVT LTD",
    "address": "SF No 345/2A-2B , Kondampatty Village, Kinathukadavu Taluk, Coimbatore - 641202",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641202"
  },
  {
    "name": "MASS METALFORM",
    "address": "G-1005 , Phase -IIIrd , RIICO Industrial Area, Bhiwadi , Dist : Alwar - 301019",
    "city": "Alwar",
    "state": "Rajasthan",
    "pinCode": "301019"
  },
  {
    "name": "HINDUSTAN AERONAUTICS LTD., LCA TEJAS DIVISION",
    "address": "LCA Tejas Division , Post Bag - 3791, Marathalli Post , Marathalli , ( Nr Yemalur Road ), Bengaluru - 560037",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560037"
  },
  {
    "name": "ACCURATE BEARING COMPONENTS",
    "address": "# 1 (A), KIADB Industrial Area, Doddaballapur, Bengalore - 561203",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "561203"
  },
  {
    "name": "MASS WIRE & STEELS PRIVATE LIMITED.,",
    "address": "SP-149 ,D , E & F , RIICO Industrial Area, Phase -1, Bhiwadi , Alwar - 301019",
    "city": "Alwar",
    "state": "Rajasthan",
    "pinCode": "301019"
  },
  {
    "name": "NTN NEI MANUFACTURING INDIA PVT LTD., REWARI",
    "address": "Plot No 131, Sector - 07, HSIIDC IMT Bawal, Rewari - 123501",
    "city": "Rewari",
    "state": "Haryana",
    "pinCode": "123501"
  },
  {
    "name": "MALNAD ALLOY CASTINGS PVT LTD.,",
    "address": "36-A , Shimogga - Bhadravathi Indl Area, Machenahalli, Nidige Post, Shimogga - 577222",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "577222"
  },
  {
    "name": "ACCURATE PRODUCTS CORPORATION PVT LTD.,",
    "address": "No AC-25A , AC24 & AC-22A , SIDCO Industrial Estate, Thirumudivakkam, Chennai - 600132",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pinCode": "600132"
  },
  {
    "name": "ANUGRAHA VALVE CASTINGS LTD., UNIT-VII",
    "address": "Sf No 35/1A2 , 35/1B2 , 37/2 , Selambarayanpalayam, Sundamedu Road, Paduva, Coimbatore - 641659",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641659"
  },
  {
    "name": "BRIGHT INDIA TOOLS",
    "address": "Shop No F10, Basaveshwar Indl Complex, Plot No 02, Sector - 10, Visheshwar Chowk, PCNTDA MIDC Road, Bhosari - 411026",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "411026"
  },
  {
    "name": "RYDON INDUSTRIES PVT LTD.,",
    "address": "No 2/92A-6, Thenampalayam, Annur Road, Arasur Post, Coimbaotre - 641407",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "641407"
  },
  {
    "name": "ROOP AUTO FORGE PVT LTD.,",
    "address": "Plot No 38 , Huda Industrial Area, Dharuhera (Rewari) - 123106",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "123106"
  },
  {
    "name": "JK MAINI PRECISION TECHNOLOGY LTD., 16B UNIT",
    "address": "No 16-B , 1st Phase , Peenya Industrial Area, Bengaluru - 560058",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560058"
  },
  {
    "name": "POWERAMPS TECHNOLOGY PVT LTD",
    "address": "No 113, Yelachenahalli, Opp Jc Indl Estate, Kanakapura Rd, Bangalore - 560062",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560062"
  },
  {
    "name": "NIRANTHARA PRECISION ENGINEERING PVT LTD.,",
    "address": "Plot No 791-L7-A, 3rd Phase, KIADB Indl Area, Harohalli, Bengaluru - 562112",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562112"
  },
  {
    "name": "C.C.S. ADVANCE TECH. CO., LTD.",
    "address": "54/2, M.9 Soi Kantana, Bangai-Bangkoolad Rd., Bangmuang , Bangyai, Nothaburi - 11140 Thailand, Tel No: 66(0) 2443-6996, 66(0) 2443-6969",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "000000"
  },
  {
    "name": "MGA INDUSTRIES",
    "address": "Plot No 205 , Sector - 24 , Faridabad - 121005",
    "city": "Faridabad",
    "state": "Haryana",
    "pinCode": "121005"
  },
  {
    "name": "HINDUSTAN AERONAUTICS LTD., AEROSPACE DIVISION",
    "address": "Aerospace Division, Post Bag No - 7502 , New Thippasandra  Post, Bangalore - 560075",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560075"
  },
  {
    "name": "KALPANA FORGINGS INDIA PVT LTD.,",
    "address": "Plot No 34-35, Sector - 6, Faridabad - 121006, Ph No: 0129-4063571,72",
    "city": "Faridabad",
    "state": "Haryana",
    "pinCode": "121006"
  },
  {
    "name": "EPSILON ULTRA AUTOMATION PVT LTD",
    "address": "Door No 14 , S. Pathy Nagar, Sengathurai Road, Sulur , Coimbatore - 641402",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641402"
  },
  {
    "name": "ULTRA MAG NDT SYSTEMS",
    "address": "Shree Plaza , H No 7/4/107, Madhavi Nagar , Balanagar, Secunderbad, Hyderabad - 500042",
    "city": "Hyderabad",
    "state": "Telangana",
    "pinCode": "500042"
  },
  {
    "name": "DENO MANUFACTURING & SOLUTIONS INDIA PVT LTD",
    "address": "No 31-C1 , Veerasandra Industrial Area, Hosur Road, Attibele Hobli, Anekal Taluk, Bengaluru - 560100",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560100"
  },
  {
    "name": "SHREE ADHISHESH ENGINEERING COMPANY",
    "address": "No 4/202C , Achampalayam, Karegoundenpalayam, Annur, Coimbatore - 641653",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641653"
  },
  {
    "name": "ASTROBASE SPACE TECHNOLOGIES PVT LTD.,",
    "address": "Plot No 411 , Sompura 2nd Stage , Dabaspet Industrial Area, Bangalore - 562132",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562132"
  },
  {
    "name": "JK MAINI PRECISION TECHNOLOGY LTD,. 5A",
    "address": "5A , Bommasandra Industrial Estate, Bommasandra , Anekal Taluk, Bangalore - 560099",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560099"
  },
  {
    "name": "SUNDRAM FASTENERS LIMITED., SEZ PLANT",
    "address": "SFL-SEZ, Plot No AA1, Central Avenue, Mahindra World City Post, Chengalpet, Kancheepuram District - 603004",
    "city": "Kancheepuram",
    "state": "Tamil Nadu",
    "pinCode": "603004"
  },
  {
    "name": "SUNFLAG IRON & STEEL CO.LTD",
    "address": "Warthi-Bhandara Road, Dist - Bhandara ( M.S.) - 441905",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "441905"
  },
  {
    "name": "PC SONS CASTINGS PVT LTD.,",
    "address": "321, 322, Pollachi Main Road, Malumachampatti , Coimbatore - 641050",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641050"
  },
  {
    "name": "STAR WIRE ( INDIA) LIMITED - PLANT II",
    "address": "Mohana Road ,Village - Chhainsa , Ballabgarh, Faridabad - 121004",
    "city": "Faridabad",
    "state": "Haryana",
    "pinCode": "121004"
  },
  {
    "name": "SATELITE FORGING PVT LTD - UNIT II",
    "address": "NH-8, Village Begampur , Khatola PO , Khandsa , Gurugram - 122002",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "122002"
  },
  {
    "name": "SUNAND ENTERPRISES",
    "address": "Near by Kalyani Maxion Wheels, Kuruli, Chakan, Pune - 410505",
    "city": "Pune",
    "state": "Maharashtra",
    "pinCode": "410505"
  },
  {
    "name": "ARBROWN INDIA TRADING PVT LTD.,",
    "address": "Unit No C-9002, 9th Floor, Palm Springs Plaza, Golf Course Road, Gurgaon - 122009",
    "city": "Gurgaon",
    "state": "Haryana",
    "pinCode": "122009"
  },
  {
    "name": "BALAJI SUPER ALLOYS",
    "address": "No 223A/1C, Bettathapuram Pirivu , Karamadai, Coimbatore - 641104",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641104"
  },
  {
    "name": "SAN PRECISION ALLOYS PRIVATE LIMITED.,",
    "address": "SF No 225 & 226 PT , Kondampatty Village , Kinathukadavu , Pollachi Taluk, Coimbatore - 641202",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641202"
  },
  {
    "name": "OMNI AUTO LIMITED",
    "address": "No 350 North, Belerica Road, Post Box No 1, Sri City DTZ, Varadaiahpalem -, Chittor District - 517588",
    "city": "Chittoor",
    "state": "Andhra Pradesh",
    "pinCode": "517588"
  },
  {
    "name": "ANUGRAHA VALVE CASTING LIMITED.,",
    "address": "SF No 391/2 , Sengoda Gounden Pudur, Arasur Village, Coimbatore - 641407",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641407"
  },
  {
    "name": "RANGSONS AEROSPACE PVT LTD.,",
    "address": "# 9, KIADB Industrial Area, Sy 35, Part 36 ,42, Belagola Hobli, Srirangapatna Mandya - 570401, (Nr Emerald Enclave , Hebbal Indl Area, Mysore - 570016)",
    "city": "Mysuru",
    "state": "Karnataka",
    "pinCode": "570401"
  },
  {
    "name": "KRISHNA ENTERPRISES",
    "address": "Plot No 848-849, Sector - 69, HSIIDC , IMT Faridabad - 121004",
    "city": "Faridabad",
    "state": "Haryana",
    "pinCode": "121004"
  },
  {
    "name": "CHEMIN SPRING INDIA PVT LTD.,",
    "address": "Plot No - 30A , Sector 8B , IIE Sidcul , Haridwar  - 249403",
    "city": "Haridwar",
    "state": "Uttarakhand",
    "pinCode": "249403"
  },
  {
    "name": "TOYOTA KIRLOSKAR AUTO PARTS PVT LTD",
    "address": "Plot No 21, Bidadi Industrial Area, Bidadi, Ramanagara District, Bangalore - 562109",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562109"
  },
  {
    "name": "WENDT (INDIA) LIMITED.,",
    "address": "No 69/70 , Sipcot , Hosur - 635126",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pinCode": "635126"
  },
  {
    "name": "SPRING DYNAMICS PVT LTD.,",
    "address": "Plot No 304A, PHASE II, KIADB Industrial Area, Kanakapura Taluk, Ramanagara - 562112",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "562112"
  },
  {
    "name": "SKY NDT",
    "address": "No 38/211, Anna Street,  Periyar Nagar, Thiruvanmiyur, Chennai - 600 041",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pinCode": "000000"
  },
  {
    "name": "MICRO TURNERS., NALAGARH",
    "address": "MT06 Nalagarh, Village Harraipur, Po- Kharoni, Tehsil- Nalagarh, Dist - Solan - 174101",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "174101"
  },
  {
    "name": "IM GEARS PRIVATE LIMITED.,",
    "address": "235/1 A&2C , Vengani Vasal Main Road, Madambakkam Post , Selaiyur , Chennai - 600073",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pinCode": "600073"
  },
  {
    "name": "FIDRATECH SOLUTIONS PVT LTD.,",
    "address": "No 19, Kalaimangal NGR Part 4 , Pazanthandalam, Thirumudivakkam, Chennai - 600044",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pinCode": "600044"
  },
  {
    "name": "GKN DRIVELINE (INDIA) LTD., FARIDABAD",
    "address": "Plot No 270, Sector - 24, Faridabad - 121005",
    "city": "Faridabad",
    "state": "Haryana",
    "pinCode": "121005"
  },
  {
    "name": "KAY JAY FORGINGS PRIVATE LIMITED UNIT-II",
    "address": "SF No. 494, Kothakondapalli Village , Hosur, Krishnagiri Dist, Hosur - 635109",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pinCode": "635109"
  },
  {
    "name": "ADROIT AUTMATION INDIA PVT LTD., UNIT-II",
    "address": "No 27/4 A, Anumepalli Village, Begapalli Road, Sipcot - I, Zuzuvadi , Hosur - 635126",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pinCode": "635126"
  },
  {
    "name": "SHARP ENGINEERS",
    "address": "E-185, Phase -7 ,Industrial Area, Mohali, Mohali - 160059",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "160059"
  },
  {
    "name": "TOYOTA INDUSTRIES ENGINE INDIA PVT LTD.,",
    "address": "Plot No 09, Phase - II , Jigani Indl Area,Jigani, Bangalore - 560105",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560105"
  },
  {
    "name": "UNIMECH AEROSPACE & MANUFACTURING LTD.,",
    "address": "Plot No 30-A of (IT Sector) Hi-Tech, Defense & Aerospace Park  Indl Area, Near KIAL, Bengaluru - 562149",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562149"
  },
  {
    "name": "JK MAINI GLOBAL AEROSPACE LIMITED.,",
    "address": "No 122-A , C , D & E , Hosur Road, Bommasandra Industrial Area, Anekal (T), Bangalore - 560099",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560099"
  },
  {
    "name": "STEEL FORGE",
    "address": "( A Unit of Moti Plastics & Estates Pvt Ltd ), Plot No 5, Sector - 6, Mathura Road, Faridabad - 121006, Tel No: 0129-4061494, 4061495",
    "city": "Faridabad",
    "state": "Haryana",
    "pinCode": "121006"
  },
  {
    "name": "REGINSON INDIA PVT LTD.,",
    "address": "Gat No - 2131, Mohitewadi, Shelpimpalgaon, Chakan-Shikrapur Road, Taluka - Khed, Pune - 410501",
    "city": "Pune",
    "state": "Maharashtra",
    "pinCode": "410501"
  },
  {
    "name": "MOD FORGE PRIVATE LIMITED.,",
    "address": "No 52, Eliambedu Village, Ponneri - 601204",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "601204"
  },
  {
    "name": "JK MAINI PRECISION TECHNOLOGY LTD., B165 UNIT",
    "address": "No B 165, 3rd Cross, 1st Stage, Peenya Industrial Estate, Bengaluru -560058",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560058"
  },
  {
    "name": "SUNDRAM FASTENERS LIMITED.,HOSUR PM PLANT II",
    "address": "Hosur - PM Plant II , Harita, Hosur , Krishnagiri Dist - 635109",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pinCode": "635109"
  },
  {
    "name": "MICRO TURNERS HARIDWAR",
    "address": "MT07 Haridwar, Plot No 7, 8 & 8A IP-4, Begampur , Haridwar - 249402",
    "city": "Haridwar",
    "state": "Uttarakhand",
    "pinCode": "249402"
  },
  {
    "name": "MULTIPLE SPECIAL STEEL PVT.LTD.,",
    "address": "Sy No 30/11, Ramanath Complex, Shanthipura Main Road, Huskur Post, Bengaluru - 560099",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560099"
  },
  {
    "name": "ARUNA BRIGHT BAR & ENGINEERING WORKS",
    "address": "Unit-I , No 24 III Phase, Sidco Indl Estate, Unit-II No A13&A14 , I Phase , Sidco Indl Estate, Hosur - 635126",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pinCode": "635126"
  },
  {
    "name": "TALBROS ENGINEERING LIMITED.,",
    "address": "Plot No 74-75-76 , Sector - 6 , Faridabad - 121006",
    "city": "Faridabad",
    "state": "Haryana",
    "pinCode": "121006"
  },
  {
    "name": "JASH RING FORGE",
    "address": "Survey No 36/1, 37/2, 38/1 , Plot No 20 to 22, & 40 to 42, Kishan Indl Area, NH-27 , Gondal Tall Plaza , At - Bharudi, Tal- Gondal, Rajkot - 360311",
    "city": "Rajkot",
    "state": "Gujarat",
    "pinCode": "360311"
  },
  {
    "name": "WINSTAR NDT SERVICES",
    "address": "No 84/2, SIDCO Industrial Estate, North Phase, Ambattur, Chennai - 600 098",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pinCode": "000000"
  },
  {
    "name": "KDDL LTD -UNIT  EIGEN-III",
    "address": "No. 55-A, Hitech-Defence & Aerospace Park, Unachur Village, Jala Hobli, Bangalore North, Yelahanka, Bangalore Urban-562149",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562149"
  },
  {
    "name": "FINEPUNCH FAB PVT LTD.,",
    "address": "Sy No 16-3 , Shed No B , Doddanagamangala Road, Electronic City Phase II , Bangalore - 560100",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560100"
  },
  {
    "name": "RANE (MADRAS) LIMITED., ENGINE COMPONENTS DIVISION",
    "address": "Plant - 4, Survey No 177/20, Aziznagar Village, Rangareddy  Dist., Hyderabad - 500075",
    "city": "Hyderabad",
    "state": "Telangana",
    "pinCode": "500075"
  },
  {
    "name": "SAMRAT FORGINGS LTD.,  UNIT-II",
    "address": "Village & P O Bhankarpur , Mohali - 140201",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "140201"
  },
  {
    "name": "SOMIC INDIA PRIVATE LIMITED (GUJRAT)",
    "address": "Survey No 212 & 219, Old Survey No 105/1 & 109, Village Navyani , Taluka - Dasada, Surendranagar - 382750",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "382750"
  },
  {
    "name": "ANUGRAHA VALVE CASTINGS LTD., UNIT-V",
    "address": "S.F. No 307, Sengoda Gounden Pudur, Arasur Village, Coimbatore - 641407",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641407"
  },
  {
    "name": "UNIQUE FORGE (GUJ) PVT LTD.,",
    "address": "Survey No - 240, B/H GEB Sub Station, Shapar-360024,Rajkot",
    "city": "Rajkot",
    "state": "Gujarat",
    "pinCode": "360024"
  },
  {
    "name": "ALFATEK",
    "address": "No 8/20 B, Brindavan Colony, Kavundapalayam P.O., Coimbatore - 641030",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641030"
  },
  {
    "name": "FORSET FORGE LLP",
    "address": "Survey No 605 , Plot No 2 ,Samrat Indl Zone, Near 66 Kv Road, Pipaliya SS , At - Ardoi , Tal - Kodta Sangani , Rajkot - 360311",
    "city": "Rajkot",
    "state": "Gujarat",
    "pinCode": "360311"
  },
  {
    "name": "TECHNICAL PETROLEUM SOLUTIONS LLC",
    "address": "Office # 91, Building # 52, Way # 319, PO 1073, PC 133, Ghala, Muscat , Sultanate of Oman, Cont No: 96897757401",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "000000"
  },
  {
    "name": "TD POWER SYSTEMS LTD., UNIT-I",
    "address": "Plot No 27, 28 & 29 , KIADB Indl Area, Dabaspet, Bangaore Rural - 562111",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "562111"
  },
  {
    "name": "LIND JENSEN MACHINERY PRIVATE LIMITED",
    "address": "Indospace Industrial Park Oragadam II Ihina -B500A, No. 165, Venbakkam Village, Panrutty Post, Walajabad Road,Oragadam, Kancheepuram - 631604",
    "city": "Kancheepuram",
    "state": "Tamil Nadu",
    "pinCode": "631604"
  },
  {
    "name": "TD POWER SYSTEMS LIMITED.,UNIT-II",
    "address": "Sy No 59/2, Yedehalli Village, Sompura Hobli, Dobaspet, Nelamangala Taluk , Bangalore - 562111",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562111"
  },
  {
    "name": "PRAGATHI STEEL CASTINGS PVT LTD.,",
    "address": "No 41 & 42, Shimoga-Bhadravathi Indl Area, Machenahalli, Nidige Post, Shimoga - 577222",
    "city": "Shivamogga",
    "state": "Karnataka",
    "pinCode": "577222"
  },
  {
    "name": "SUNDRAM FASTENERS LIMITED., KPM PM DIVISION",
    "address": "No 126, 133-139 , NH45B , Madurai-Tuticorin Highway, Krishnapuram , Aviyur (Po) , Kariapatti Taluk, Virudhunagar - 626115",
    "city": "Madurai",
    "state": "Tamil Nadu",
    "pinCode": "626115"
  },
  {
    "name": "AMEX ALLOYS PRIVATE LIMITED.,",
    "address": "SF No 289/2 , Kunnathur Pudur (PO) , Sathy Road, Coimbatore - 641107",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641107"
  },
  {
    "name": "TECHNICAL PETROLEUM SOLUTIONS LLC ., UAE",
    "address": "Madinat Zayed, Madinat Zayed East 16 , Abu Dhabi , United Arab Emirates",
    "city": "Unknown",
    "state": "Karnataka",
    "pinCode": "000000"
  },
  {
    "name": "ELLIOTT EBARA TURBOMACHINERY INDIA PVT LTD.,",
    "address": "# 12/3 , Abbanakuppe, Bidadi Industrial Area, Bidadi Post , Bangalore - 562109",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "562109"
  },
  {
    "name": "CIE AUTOMOTIVE INDIA LTD., PLANT 1",
    "address": "(Bill Forge Division ), No 9C, Bommasandra Indl Area, Bangalore - 560099",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560099"
  },
  {
    "name": "CLASSIC FASTENERS INC",
    "address": "B-50 , 4th Cross, ITI Indl Estate, White Filed Road, Mahadevapura , Bangalore - 560048",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560048"
  }
];

// POST /api/bulk-import/customers
// Protected — requires admin token + secret key
router.post('/customers', async (req, res) => {
  try {
    // Simple secret key guard
    if (req.headers['x-import-secret'] !== process.env.IMPORT_SECRET) {
      return res.status(403).json({ message: 'Forbidden — invalid import secret' });
    }

    const mongoose = require('mongoose');
    const db = mongoose.connection.db;

    const admin = await db.collection('users').findOne({ role: 'admin' });
    if (!admin) return res.status(400).json({ message: 'No admin user found. Run seed first.' });

    const now = new Date();
    let inserted = 0, skipped = 0;

    for (const cust of BULK_CUSTOMERS) {
      const exists = await db.collection('customers').findOne({ name: cust.name });
      if (exists) { skipped++; continue; }

      await db.collection('customers').insertOne({
        name:    cust.name,
        email:   '',
        phone:   '',
        segment: { category: 'Industry', value: 'Manufacturing' },
        unit:    'Unit 1',
        competition: 'New Account',
        address: {
          street:  cust.address,
          city:    cust.city   || '',
          state:   cust.state  || 'Karnataka',
          pinCode: cust.pinCode || '000000',
        },
        contacts: [], productInterests: [], competitors: [],
        status:    'active',
        isPending: false,
        submittedBy: admin._id,
        approvedBy:  admin._id,
        approvedAt:  now,
        assignedTo:  admin._id,
        isDeleted:   false,
        createdAt:   now,
        updatedAt:   now,
      });
      inserted++;
    }

    res.json({
      status: 'success',
      inserted,
      skipped,
      message: `Done! ${inserted} customers inserted, ${skipped} already existed.`,
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
