import React, { useEffect, useRef, useState } from "react";
import "./App.css";

/* =========================================================
   PREDEFINED JOBS
   ========================================================= */
const templates = {
  "Software Engineer":
    "Software Engineer role requiring strong programming in Python, JavaScript, Java, or C++. Must be skilled in Agile workflows. Experience with databases and version control (Git) is required.",

  "Data Scientist":
    "Data Scientist position requiring expertise in Python, R, and SQL. Must have deep knowledge of Machine Learning, NLP, TensorFlow, and PyTorch. Experience handling large datasets and scikit-learn.",

  "AI Engineer":
    "AI/ML Engineer requiring advanced Python and C++ skills. Experience in Deep Learning, building predictive models, and deploying AI solutions using Docker and AWS.",

  "DevOps Engineer":
    "DevOps Engineer focused on infrastructure and automation. Requires strong skills in Bash, Python, or Go. Must have deep expertise in CI/CD, Jenkins, Docker, Kubernetes, Linux, and cloud platforms like AWS or Azure.",

  "Cloud Engineer":
    "Cloud Engineer responsible for designing and maintaining cloud infrastructure. Requires strong knowledge of AWS, GCP, or Azure. Familiarity with Infrastructure as Code, Kubernetes, and Docker.",

  "Frontend Engineer":
    "Frontend Web Developer requiring expert-level HTML, CSS, JavaScript, and TypeScript. Must be highly skilled in modern frameworks like React. Passionate about UI/UX and responsive design.",

  "Backend Engineer":
    "Backend Developer focused on server-side logic and APIs. Requires expertise in Python (Django/Flask), Java (Spring Boot), Node.js, or Go. Strong knowledge of SQL databases and server architecture.",

  "Full Stack Engineer":
    "Full Stack Engineer capable of handling both frontend and backend. Requires JavaScript/TypeScript, React, Node.js, and Python. Experience with SQL databases, Git, and deploying web applications.",

  "Data Engineer":
    "Data Engineer responsible for building data pipelines. Requires advanced SQL and Python skills. Experience with big data tools, ETL processes, and cloud storage (AWS, GCP).",

  "QA Engineer":
    "QA Automation Engineer focused on software testing. Requires programming skills in Python or Java. Must have experience with automated testing frameworks like Selenium or Cypress, and CI/CD pipelines."
};


/* =========================================================
   PREDEFINED ROLE SKILLS
   ========================================================= */

const predefinedRoleSkills = {
  "Software Engineer": [
    "Python",
    "JavaScript",
    "Java",
    "C++",
    "Agile",
    "Databases",
    "Git"
  ],

  "Data Scientist": [
    "Python",
    "R",
    "SQL",
    "Machine Learning",
    "NLP",
    "TensorFlow",
    "PyTorch",
    "scikit-learn"
  ],

  "AI Engineer": [
    "Python",
    "C++",
    "Deep Learning",
    "Docker",
    "AWS"
  ],

  "DevOps Engineer": [
    "Bash",
    "Python",
    "Go",
    "CI/CD",
    "Jenkins",
    "Docker",
    "Kubernetes",
    "Linux",
    "AWS",
    "Azure"
  ],

  "Cloud Engineer": [
    "AWS",
    "GCP",
    "Azure",
    "Infrastructure as Code",
    "Kubernetes",
    "Docker"
  ],

  "Frontend Engineer": [
    "HTML",
    "CSS",
    "JavaScript",
    "TypeScript",
    "React",
    "UI/UX",
    "Responsive Design"
  ],

  "Backend Engineer": [
    "Python",
    "Django",
    "Flask",
    "Java",
    "Spring Boot",
    "Node.js",
    "Go",
    "SQL",
    "APIs"
  ],

  "Full Stack Engineer": [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "SQL",
    "Git"
  ],

  "Data Engineer": [
    "SQL",
    "Python",
    "ETL",
    "Data Pipelines",
    "AWS",
    "GCP"
  ],

  "QA Engineer": [
    "Python",
    "Java",
    "Selenium",
    "Cypress",
    "Automated Testing",
    "CI/CD"
  ]
};


/* =========================================================
   SAMPLE CANDIDATE NAMES
   ========================================================= */

const sampleNames = Array.from(
  { length: 50 },
  (_, i) => `Candidate ${String(i + 1).padStart(2, "0")}`
);


/* =========================================================
   MAIN APP
   ========================================================= */

export default function App() {

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("smartHireUser")) || null;
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState("signin");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [tab, setTab] = useState("screen");

  const [role, setRole] = useState("Full Stack Engineer");

  const [jd, setJd] = useState(
    templates["Full Stack Engineer"]
  );

  const [files, setFiles] = useState([]);
  const [image, setImage] = useState("");
  const [results, setResults] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedView, setSelectedView] = useState("profile");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState("Under Review");
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [notice, setNotice] = useState("");
  const resumeInput = useRef();
  const imageInput = useRef();

  useEffect(() => {
    if (!selectedCandidate || selectedView !== "resume") {
      setResumeUrl("");
      return undefined;
    }

    const resumeFile = files.find((file) => file.name === selectedCandidate.resumeFileName);
    if (!resumeFile || !/\.pdf$/i.test(resumeFile.name)) {
      setResumeUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(resumeFile);
    setResumeUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [files, selectedCandidate, selectedView]);

  const handleAuth = (event) => {
    event.preventDefault();
    const email = authEmail.trim().toLowerCase();

    if (!email || !authPassword) {
      setAuthError("Enter your email and password to continue.");
      return;
    }
    if (authPassword.length < 6) {
      setAuthError("Your password must contain at least 6 characters.");
      return;
    }

    const accounts = JSON.parse(localStorage.getItem("smartHireAccounts") || "{}");
    if (authMode === "signup") {
      if (!authName.trim()) {
        setAuthError("Enter your name to create an account.");
        return;
      }
      if (accounts[email]) {
        setAuthError("An account with this email already exists.");
        return;
      }
      accounts[email] = { name: authName.trim(), email, password: authPassword };
      localStorage.setItem("smartHireAccounts", JSON.stringify(accounts));
    } else if (!accounts[email] || accounts[email].password !== authPassword) {
      setAuthError("That email and password combination is not correct.");
      return;
    }

    const account = accounts[email];
    localStorage.setItem("smartHireUser", JSON.stringify(account));
    setUser(account);
    setAuthError("");
  };

  const signOut = () => {
    localStorage.removeItem("smartHireUser");
    setUser(null);
    setAuthPassword("");
  };

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-aside">
          <span className="brand-mark">✦ SmartHire Platform</span>
          <p className="auth-kicker">RECRUITER WORKSPACE</p>
          <h1>Build your next great team with more clarity.</h1>
          <p>Screen candidates in plain English, understand every match, and keep your hiring work moving.</p>
        </div>
        <form className="auth-card" onSubmit={handleAuth}>
          <div className="auth-card-heading">
            <span className="auth-kicker">{authMode === "signin" ? "WELCOME BACK" : "GET STARTED"}</span>
            <h2>{authMode === "signin" ? "Sign in to SmartHire" : "Create your recruiter account"}</h2>
            <p>{authMode === "signin" ? "Your workspace is waiting." : "Set up your private hiring workspace in a minute."}</p>
          </div>
          {authMode === "signup" && (
            <label>
              Full name
              <input value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Alex Morgan" autoComplete="name" />
            </label>
          )}
          <label>
            Work email
            <input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" />
          </label>
          <label>
            Password
            <input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={authMode === "signin" ? "current-password" : "new-password"} />
          </label>
          {authError && <p className="auth-error" role="alert">{authError}</p>}
          <button className="auth-submit" type="submit">{authMode === "signin" ? "Sign in" : "Create account"} <span>→</span></button>
          <p className="auth-switch">
            {authMode === "signin" ? "New to SmartHire?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setAuthError(""); }}>
              {authMode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    );
  }


  /* =========================================================
     ADD RESUME FILES
     ========================================================= */

  const addFiles = (list) => {

    const valid = Array.from(list || []).filter((f) =>
      /\.(pdf|txt)$/i.test(f.name)
    );

    setFiles((current) =>
      [...current, ...valid].slice(0, 200)
    );

    if (files.length + valid.length > 200) {
      setNotice(
        "A batch supports up to 200 resumes."
      );
    }
  };


  /* =========================================================
     SELECT JOB ROLE
     ========================================================= */

  const selectRole = (value) => {

    setRole(value);

    setJd(templates[value]);

    setNotice(
      `${value} job selected.`
    );
  };


  /* =========================================================
     SAMPLE RESUMES
     ========================================================= */

  const samples = () => {

    const skills =
      predefinedRoleSkills[role] || [];

    const skillText =
      skills.join(" ");

    setFiles(
      sampleNames.map(
        (name, i) =>
          new File(
            [
              `${role}

              Candidate: ${name}

              Skills:
              ${skillText}

              Additional Skills:
              React Node.js APIs JavaScript Python SQL Git

              Candidate number:
              ${i + 1}`
            ],
            `${name}.txt`,
            {
              type: "text/plain"
            }
          )
      )
    );

    setNotice(
      "50 sample resumes added."
    );
  };


  /* =========================================================
     SCREEN AND RANK CANDIDATES
     ========================================================= */

  const screen = async () => {

    if (!jd.trim()) {

      return setNotice(
        "Add a job description before screening."
      );
    }

    if (!files.length) {

      return setNotice(
        "Upload at least one resume to continue."
      );
    }

    setNotice(
      `Screening ${files.length} resumes for ${role}...`
    );


    /* ---------------------------------------------------------
       READ RESUME FILES
       --------------------------------------------------------- */

    const candidates = await Promise.all(

      files.map(async (file, order) => ({

        candidateName:
          file.name.replace(
            /\.[^/.]+$/,
            ""
          ),

        resumeFileName: file.name,

        resumeText:
          file.type === "text/plain"
            ? await file.text()
            : `Resume file ${file.name}`,

        order

      }))

    );


    /* ---------------------------------------------------------
       SEND DATA TO BACKEND
       --------------------------------------------------------- */

    try {

      const response = await fetch(
        "http://localhost:5000/api/applications/bulk",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            jobRole: role,

            jobDescription: jd,

            roleSkills:
              predefinedRoleSkills[role] || [],

            candidates

          })
        }
      );


      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "The screening service could not save the applications.");
      }


      setResults(
        data.applications.map((application, index) => ({
          ...application,
          resumeFileName: candidates[index].resumeFileName
        }))
      );


      setNotice(
        `${data.applications.length} candidates ranked successfully.`
      );


    } catch (error) {

      if (!(error instanceof TypeError)) {
        setNotice(error.message);
        return;
      }

      /* -------------------------------------------------------
         LOCAL PREVIEW MODE

         Used when Flask API is not running.
         ------------------------------------------------------- */

      const roleSkills =
        predefinedRoleSkills[role] || [];


      const localResults =
        candidates.map((candidate, i) => {

          const resumeText =
            candidate.resumeText.toLowerCase();


          const matchedSkills =
            roleSkills.filter((skill) =>
              resumeText.includes(
                skill.toLowerCase()
              )
            );


          let matchScore = 0;


          if (roleSkills.length > 0) {

            matchScore =
              Math.round(
                (matchedSkills.length /
                  roleSkills.length) *
                  100
              );

          }


          return {

            ...candidate,

            matchScore,

            requiredSkills: roleSkills,

            matchedSkills,

            status:
              matchScore >= 70
                ? "Strong Match"
                : matchScore >= 40
                ? "Moderate Match"
                : "Low Match"

          };

        });


      setResults(
        localResults
      );


      setNotice(
        "Showing local preview results. Start the API to save scores."
      );

    }


    setTab("results");
  };

  const getSkillBreakdown = (candidate) => {
    const requiredSkills = candidate.requiredSkills || predefinedRoleSkills[role] || [];
    const resumeText = (candidate.resumeText || "").toLowerCase();
    const matchedSkills = candidate.matchedSkills || requiredSkills.filter((skill) =>
      resumeText.includes(skill.toLowerCase())
    );
    const missingSkills = requiredSkills.filter((skill) => !matchedSkills.includes(skill));
    const skillMatchPercent = requiredSkills.length
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
      : 0;

    return { requiredSkills, matchedSkills, missingSkills, skillMatchPercent };
  };

  const openCandidate = (candidate, view) => {
    setSelectedCandidate(candidate);
    setSelectedView(view);
    setReviewComment(candidate.comment || "");
    setReviewStatus(candidate.status === "Shortlisted" || candidate.status === "Rejected" ? candidate.status : "Under Review");
  };

  const saveReview = async () => {
    if (!selectedCandidate?._id) {
      setNotice("Start the API and screen candidates again before saving recruiter reviews.");
      return;
    }

    setIsSavingReview(true);
    try {
      const response = await fetch(`http://localhost:5000/api/applications/${selectedCandidate._id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: reviewStatus, comment: reviewComment })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save recruiter review.");

      setResults((currentResults) => currentResults.map((candidate) =>
        candidate._id === data.application._id ? { ...candidate, ...data.application } : candidate
      ));
      setSelectedCandidate((candidate) => ({ ...candidate, ...data.application }));
      setNotice("Recruiter comment and candidate status saved.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setIsSavingReview(false);
    }
  };


  /* =========================================================
     UI
     ========================================================= */

  return (

    <div className="app">


      {/* =====================================================
          NAVIGATION
          ===================================================== */}

      <nav>

        <b><span>✦ smart hire platform</span>
        </b>

        <div className="nav-account">
          <small>{user.name}</small>
          <button onClick={signOut}>Sign out</button>
        </div>

      </nav>
      <main>

        {/* ===================================================
            HEADER
            =================================================== */}

        <header>
          <div>
            <label>RECRUITER WORKSPACE</label>
            <h2>Find the right people faster and turn your dreams into reality.</h2>
            <p>SmartHire is an AI recruiting platform that helps HR teams find top talent in plain English, screen candidates with explainable AI, and keep candidates engaged from "hello" to "you're hired."
          </p>
          </div>

          {image && (

            <img
              src={image}
              alt="Uploaded company branding"
            />
          )}

        </header>
        {/* ===================================================
            TABS
            =================================================== */}

        <div className="tabs">

          <button
            className={
              tab === "screen"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab("screen")
            }
          >
            Screen Candidates
          </button>


          <button
            className={
              tab === "results"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab("results")
            }
          >

            Ranked Results{" "}

            {results.length
              ? `(${results.length})`
              : ""}

          </button>

        </div>


        {/* ===================================================
            SCREEN TAB
            =================================================== */}

        {tab === "screen" ? (

          <>


            {/* =================================================
                JOB DESCRIPTION
                ================================================= */}

            <section className="panel">

              <div className="title">

                <i>
                  ◼
                </i>
                <div>
                  <h2>Job Description</h2>
                  <p>Select the role or list the skills candidates need.</p>
                </div>
              </div>

              <div className="role">
                <b>
                  Job role
                </b>

                <select
                  value={role}
                  onChange={(e) =>
                    selectRole(
                      e.target.value
                    )
                  }
                >

                  {Object.keys(templates).map(
                    (x) => (

                      <option
                        key={x}
                        value={x}
                      >
                        {x}
                      </option>

                    )
                  )}

                </select>


                <span>Choose a role to prefill the Job Description.</span>
              </div>
              <textarea
                value={jd}
                onChange={(e) =>
                  setJd(e.target.value)
                }
                placeholder="Paste the full job description here..."
              />


              {/* =================================================
                  ROLE SKILLS
                  ================================================= */}

              <div
                style={{
                  marginTop: "15px"
                }}
              >
                <b>Required Skills</b>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "10px"
                  }}
                >

                  {(
                    predefinedRoleSkills[role] ||
                    []
                  ).map(
                    (skill) => (

                      <span
                        key={skill}
                        style={{
                          padding:
                            "6px 10px",
                          borderRadius:
                            "20px",
                          background:
                            "#f1f1f1",
                          fontSize:
                            "13px"
                        }}
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              </div>
            </section>

            {/* =================================================
                UPLOAD RESUMES
                ================================================= */}

            <section className="panel">
              <div className="title">
                <i>↑</i>

                <div>
                  <h2>Upload Resumes</h2>
                  <p>Upload PDF or TXT resumes.Batches support up to 200 candidates.</p>
                </div>

                <strong>
                  {files.length}/200
                </strong>
              </div>
              <div
                className="drop"

                onClick={() =>
                  resumeInput.current.click()
                }

                onDragOver={(e) =>
                  e.preventDefault()
                }

                onDrop={(e) => {

                  e.preventDefault();

                  addFiles(
                    e.dataTransfer.files
                  );
                }}
              >
                <b>
                  ↑
                </b>

                <span>
                  Drag & drop resumes here or{" "}
                  <u>
                    browse files
                  </u>
                </span>
                <small>PDF and TXT files · up to 200 resumes per batch
                </small>


                <input
                  ref={resumeInput}
                  type="file"
                  accept=".pdf,.txt"
                  multiple

                  onChange={(e) =>
                    addFiles(
                      e.target.files
                    )
                  }
                />
              </div>

              {/* =================================================
                  FILE LIST
                  ================================================= */}

              {files.length > 0 && (

                <div className="files">

                  {files
                    .slice(0, 3)
                    .map((f) => (

                      <span
                        key={f.name}
                      >
                        • {f.name}
                      </span>

                    ))}


                  {files.length > 3 && (

                    <span>
                      + {files.length - 3} more
                    </span>

                  )}


                  <button
                    onClick={() =>
                      setFiles([])
                    }
                  >
                    Clear
                  </button>

                </div>

              )}


              <div className="or">
                OR
              </div>


              <button
                className="sample"
                onClick={samples}
              >
                Use Sample Resumes
                (50 candidates)
              </button>

            </section>


            {/* =================================================
                SCREEN BUTTON
                ================================================= */}

            <button
              className="screen"
              onClick={screen}
            >
              Screen & Rank Candidates{" "}
              <span>
                {files.length} resumes
              </span>

            </button>

          </>

        ) : (


          /* ===================================================
             RESULTS TAB
             =================================================== */

          <section className="results">


            <div className="resultsHead">

              <div>

                <label>
                  ROLE: {role.toUpperCase()}
                </label>

                <h2>Candidate ranking</h2>
                <p>{results.length} resumes screened against this Job Description.</p>

              </div>
              <button
                onClick={() =>
                  setTab("screen")
                }
              >
                Screen another batch
              </button>

            </div>


            {/* =================================================
                CANDIDATE RESULTS
                ================================================= */}

            {[...results]
              .sort(
                (a, b) =>
                  b.matchScore -
                  a.matchScore
              )

              .map((r, i) => (

                <article
                  key={
                    r.candidateName +
                    i
                  }
                >

                  <em>
                    #{i + 1}
                  </em>


                  <i>

                    {r.candidateName
                      .split(" ")
                      .map(
                        (x) =>
                          x[0]
                      )
                      .join("")}

                  </i>


                  <div className="candidate-summary">

                    <b>
                      {r.candidateName}
                    </b>

                    <small>
                      {r.status ||
                        "Screened"}
                    </small>

                    <span className="skill-summary">
                      {(() => {
                        const skills = getSkillBreakdown(r);
                        return `Skill match: ${skills.matchedSkills.length}/${skills.requiredSkills.length} (${skills.skillMatchPercent}%)`;
                      })()}
                    </span>

                  </div>
                  <strong>
                    {r.matchScore}%
                    <small>match</small>

                  </strong>
                  <button onClick={() => openCandidate(r, "profile")}>
                    View profile →
                  </button>
                  <button className="resume-button" onClick={() => openCandidate(r, "resume")}>
                    View resume →
                  </button>

                </article>

              ))}

          </section>
        )}

        {selectedCandidate && (() => {
          const skills = getSkillBreakdown(selectedCandidate);

          return (
            <div className="profile-backdrop" role="presentation" onClick={() => setSelectedCandidate(null)}>
              <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title" onClick={(event) => event.stopPropagation()}>
                <button className="profile-close" aria-label="Close profile" onClick={() => setSelectedCandidate(null)}>×</button>
                <label>{selectedView === "profile" ? "CANDIDATE PROFILE" : "RESUME DOCUMENT"}</label>
                <h2 id="profile-title">{selectedCandidate.candidateName}</h2>
                <div className="modal-switcher" role="tablist" aria-label="Candidate details">
                  <button className={selectedView === "profile" ? "active" : ""} onClick={() => setSelectedView("profile")}>Profile</button>
                  <button className={selectedView === "resume" ? "active" : ""} onClick={() => setSelectedView("resume")}>Resume</button>
                </div>
                {selectedView === "resume" ? (
                  resumeUrl ? (
                    <iframe className="resume-pdf" src={resumeUrl} title={`${selectedCandidate.candidateName} resume`} />
                  ) : (
                    <pre className="resume-document">{selectedCandidate.resumeText || "No resume text is available for this candidate."}</pre>
                  )
                ) : (
                  <>
                    <div className="profile-scores">
                      <div><b>{selectedCandidate.matchScore}%</b><span>overall match</span></div>
                      <div><b>{skills.skillMatchPercent}%</b><span>skills match</span></div>
                    </div>
                    <div className="profile-section">
                      <h3>Required skills ({skills.requiredSkills.length})</h3>
                      <div className="skill-tags required-skills">
                        {skills.requiredSkills.map((skill) => <span key={skill}>{skill}</span>)}
                      </div>
                    </div>
                    <div className="profile-section">
                      <h3>Matched skills ({skills.matchedSkills.length})</h3>
                      <div className="skill-tags matched-skills">
                        {skills.matchedSkills.length ? skills.matchedSkills.map((skill) => <span key={skill}>{skill}</span>) : <p>No required skills found in this resume.</p>}
                      </div>
                    </div>
                    {skills.missingSkills.length > 0 && <div className="profile-section">
                      <h3>Skills still needed ({skills.missingSkills.length})</h3>
                      <div className="skill-tags missing-skills">
                        {skills.missingSkills.map((skill) => <span key={skill}>{skill}</span>)}
                      </div>
                    </div>}
                    <div className="profile-section recruiter-review">
                      <h3>Recruiter review</h3>
                      <label htmlFor="candidate-status">Candidate status</label>
                      <select id="candidate-status" value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)}>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <label htmlFor="recruiter-comment">Comment</label>
                      <textarea
                        id="recruiter-comment"
                        value={reviewComment}
                        onChange={(event) => setReviewComment(event.target.value)}
                        placeholder="Add a note about this candidate..."
                        rows="4"
                      />
                      <button type="button" onClick={saveReview} disabled={isSavingReview}>
                        {isSavingReview ? "Saving..." : "Save Comment"}
                      </button>
                      {!selectedCandidate._id && <small>Screen candidates with the backend enabled to save this review.</small>}
                    </div>
                  </>
                )}
              </section>
            </div>
          );
        })()}
        {/* =====================================================
            NOTICE
            ===================================================== */}

        {notice && (
          <aside>
            {notice}
          </aside>
        )}
      </main>
    </div>
  );
}
