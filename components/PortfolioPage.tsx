import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { PortfolioItem, LinkItem } from '../types.ts';

// --- Data ---
const portfolioData = {
  name: "Aryan Jain",
  title: "SDET | QA Automation Engineer | Software Developer in Test",
  contact: {
    links: [
      { name: "LinkedIn", url: "https://in.linkedin.com/in/aryanjain584" },
      { name: "GitHub", url: "https://github.com/coolAryan" },
      { name: "LeetCode", url: "https://leetcode.com/aryanjain584" },
      { name: "HackerRank", url: "https://www.hackerrank.com/aryanjain584" },
    ],
  },
  summary: "Results-driven SDET and QA Automation Engineer with 3+ years of experience in building robust test automation frameworks, UI/API testing, and continuous test integration. I turn quality assurance into a craft, blending precision with a passion for flawless user experiences.",
  education: { name: "B.Tech. in Electronics & Communication", description: "JECRC Foundation (Rajasthan Technical University) | 2018 – 2022 | CGPA: 8.1 / 10" },
  experience: [
    {
      title: "Software Engineer @ InTimeTec",
      date: "July 2022 - Present",
      subsections: [
        {
          heading: "HP Dunes",
          points: [
            "Developed & maintained scalable test automation suites using Java & Selenium, enhancing test coverage & reliability.",
            "Redesigned test framework to improve test reliability and reduce manual testing by 20%.",
            "Created unit and integration tests for firmware services, resulting in a 30% reduction in post-release bugs.",
            "Triaged and resolved 40+ beta issues, achieving 0% reproducibility.",
            "Led integration of third-party apps, collaborating across teams to deliver milestones.",
            "Migrated test environments to HTTPS (Docker), reducing SSL errors and test flakiness.",
            "Mentored new hires on automation frameworks, best practices, and Agile methodologies.",
          ],
        },
        {
          heading: "ITSM MPS",
          points: [
            "Automated 150+ UI & API test cases using Java, Selenium, Rest Assured improving testing coverage.",
            "Improved framework using SOLID principles & KISS methodology.",
            "Led PR review process and code quality improvements.",
            "Proficient in Page Object Model (POM) and Maven Lifecycle.",
          ],
        },
        {
          heading: "AI-Driven Efficiency Initiatives",
          points: [
            "Applied prompt engineering to fine-tune LLM outputs for test data generation and documentation.",
            "Used AI tools like ChatGPT to automate routine QA tasks, boosting test efficiency.",
          ],
        },
      ],
    },
  ],
  skills: ["Java", "Python", "Selenium", "TestNG", "RestAssured", "Maven", "Git", "GitHub", "Docker", "JIRA", "SQL", "JavaScript", "C++", "SOLID", "TDD", "BDD", "Page Object Model (POM)"],
  projects: [
    { name: "Music Player Console App (C++)", description: "Designed console app using OOP + SOLID. Integrated GTest & GMock for robust testing." },
    { name: "Sports Carnival App (Java)", description: "Built a multithreaded Java TCP application with a custom communication protocol." },
  ],
  achievements: [
    { name: "Winner – Smart India Hackathon 2022 (DRDO Track)", description: "Real-time criminal detection using CCTV feeds." },
    { name: "Runner-Up – TechFoo Hackathon", description: "LMS prototype for assignments and content sharing." },
  ],
};


// --- HOOK for Scroll Animation ---
const useOnScreen = (options: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref, options]);

  return [ref, isVisible] as const;
};


// --- UI Components ---
interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, className = '', stagger = false }) => {
  const [ref, isVisible] = useOnScreen({ threshold: 0.1 });
  
  return (
    <div ref={ref} className={`py-16 sm:py-24 ${className}`}>
      <div className={`container mx-auto px-4 max-w-5xl ${stagger ? 'flex flex-col gap-4' : ''}`}>
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement<{ className?: string, style?: React.CSSProperties }>(child)) {
            return React.cloneElement(child, {
              className: `${child.props.className || ''} reveal-hidden ${isVisible ? 'reveal-visible' : ''}`,
              style: { ...child.props.style, transitionDelay: `${stagger ? index * 100 : 0}ms` }
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{children: ReactNode, className?: string; style?: React.CSSProperties}> = ({ children, className, style }) => (
    <h2 className={`text-4xl font-bold text-center text-cyan-400 mb-12 ${className}`} style={style}>{children}</h2>
);

const SkillPill: React.FC<{skill: string, className?: string; style?: React.CSSProperties}> = ({ skill, className, style }) => (
    <div className={`bg-slate-700 text-slate-300 px-4 py-2 rounded-full text-base font-medium ${className}`} style={style}>
        {skill}
    </div>
);

// --- MAIN PORTFOLIO PAGE ---
const PortfolioPage: React.FC = () => {
  return (
    <div className="text-slate-300">
      {/* Hero Section */}
      <section className="h-screen flex flex-col justify-center items-center text-center p-4">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white">{portfolioData.name}</h1>
        <p className="mt-4 text-xl md:text-2xl text-slate-400 max-w-3xl">{portfolioData.title}</p>
        <div className="flex justify-center items-center gap-6 mt-8">
            {portfolioData.contact.links.map(link => (
                <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" 
                   className="text-slate-400 hover:text-cyan-400 transition-colors duration-300 font-medium text-lg">
                {link.name}
                </a>
            ))}
        </div>
      </section>

      {/* Summary Section */}
      <AnimatedSection>
        <p className="text-2xl md:text-3xl text-center font-light leading-relaxed text-slate-200">
            {portfolioData.summary}
        </p>
      </AnimatedSection>
      
      {/* Skills Section */}
      <AnimatedSection stagger>
        <SectionTitle>Technical Skills</SectionTitle>
        <div className="flex flex-wrap justify-center gap-3">
            {portfolioData.skills.map(skill => <SkillPill key={skill} skill={skill} />)}
        </div>
      </AnimatedSection>
      
      {/* Experience Section */}
       <AnimatedSection>
        <SectionTitle>Professional Experience</SectionTitle>
        <div className="max-w-3xl mx-auto">
          {portfolioData.experience.map((exp, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-6">
                <h3 className="text-2xl font-bold text-white">{exp.title}</h3>
                <p className="text-slate-400 font-mono flex-shrink-0 ml-4">{exp.date}</p>
              </div>
              <div className="space-y-8">
                {exp.subsections.map((sub, j) => (
                  <div key={j} className="pl-4 border-l-2 border-slate-700">
                    <h4 className="text-xl font-semibold text-cyan-400 mb-3">{sub.heading}</h4>
                    <ul className="space-y-2 list-disc list-inside text-slate-400">
                      {sub.points.map((point, k) => (
                        <li key={k}>{point}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* Projects & Achievements Section */}
      <AnimatedSection>
        <SectionTitle>Projects & Achievements</SectionTitle>
        <div className="grid md:grid-cols-2 gap-8 text-left">
          {[...portfolioData.projects, ...portfolioData.achievements].map((item, i) => (
            <div key={i} className="bg-slate-800 p-6 rounded-lg">
              <h4 className="text-xl font-bold text-cyan-400">{item.name}</h4>
              <p className="mt-2 text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>
      
      {/* Education Section */}
      <AnimatedSection>
        <SectionTitle>Education</SectionTitle>
        <div className="text-center bg-slate-800 p-6 rounded-lg max-w-2xl mx-auto">
            <h4 className="text-xl font-bold text-white">{portfolioData.education.name}</h4>
            <p className="mt-2 text-slate-400">{portfolioData.education.description}</p>
        </div>
      </AnimatedSection>

       <footer className="text-center p-8 text-slate-500">
            <p>Designed and built by Aryan Jain.</p>
       </footer>
    </div>
  );
};

export default PortfolioPage;