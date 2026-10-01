import re

with open('app/(public)/leadership/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add aria-label and title to LinkedIn
content = content.replace(
    'className="prof-social-btn">\n                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">\n                      <path d="M20.447',
    'className="prof-social-btn" aria-label={`View ${m.name}\'s LinkedIn profile`} title="LinkedIn Profile">\n                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">\n                      <path d="M20.447'
)

# Add title to GitHub (it already has aria-label)
content = content.replace(
    'aria-label={`View ${m.name}\'s GitHub profile`}\n                  className="prof-social-btn"',
    'aria-label={`View ${m.name}\'s GitHub profile`}\n                  title="GitHub Profile"\n                  className="prof-social-btn"'
)

# Add aria-label and title to Email
content = content.replace(
    'className="prof-social-btn">\n                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"\nstrokeWidth="1.5">\n                      <path d="M4 4h16',
    'className="prof-social-btn" aria-label={`Send email to ${m.name}`} title="Email">\n                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">\n                      <path d="M4 4h16'
)

# Wait, the spacing in Email might be different. Let's use regex.
content = re.sub(r'className="prof-social-btn">\s*<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"\s*strokeWidth="1.5">\s*<path d="M4 4h16', 
                 r'className="prof-social-btn" aria-label={`Send email to ${m.name}`} title="Send Email">\n                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">\n                      <path d="M4 4h16', content)

content = re.sub(r'className="prof-social-btn">\s*<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"\s*strokeWidth="1.5">\s*<circle cx="12"',
                 r'className="prof-social-btn" aria-label={`Visit ${m.name}\'s personal website`} title="Personal Website">\n                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">\n                      <circle cx="12"', content)


with open('app/(public)/leadership/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
