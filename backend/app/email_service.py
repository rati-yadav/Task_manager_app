import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app


def send_email(to_address: str, subject: str, html_body: str):
    """
    Sends an email using Gmail SMTP with an App Password.

    Steps to set this up:
    1. Enable 2-Step Verification on your Google Account.
    2. Go to Google Account > Security > App Passwords.
    3. Generate a password for "Mail" and put it in GMAIL_APP_PASSWORD.
    """
    sender = current_app.config["GMAIL_SENDER"]
    password = current_app.config["GMAIL_APP_PASSWORD"]

    if not sender or not password:
        current_app.logger.warning("Gmail credentials not configured, skipping email.")
        return

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = to_address
    message.attach(MIMEText(html_body, "html"))

    try:
        # Gmail SMTP over TLS
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender, password)
            server.sendmail(sender, to_address, message.as_string())
        current_app.logger.info(f"Email sent to {to_address}: {subject}")
    except Exception as e:
        # Log but don't crash the request if email fails
        current_app.logger.error(f"Failed to send email to {to_address}: {e}")


def send_task_created_email(assignee_email: str, assignee_name: str,
                             task_title: str, task_description: str,
                             creator_name: str, due_date: str | None):
    subject = f"New Task Assigned: {task_title}"
    due_str = f"<p><strong>Due Date:</strong> {due_date}</p>" if due_date else ""
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4F46E5;">You have a new task!</h2>
        <p>Hi {assignee_name},</p>
        <p><strong>{creator_name}</strong> has assigned you a new task:</p>
        <div style="background: #F3F4F6; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px;">{task_title}</h3>
            <p style="margin: 0; color: #6B7280;">{task_description or 'No description provided.'}</p>
        </div>
        {due_str}
        <p style="color: #6B7280; font-size: 13px;">Log in to your Task Manager to view and update this task.</p>
    </div>
    """
    send_email(assignee_email, subject, html_body)


def send_task_completed_email(creator_email: str, creator_name: str,
                               task_title: str, assignee_name: str):
    subject = f"Task Completed: {task_title}"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #10B981;">Task Completed ✓</h2>
        <p>Hi {creator_name},</p>
        <p><strong>{assignee_name}</strong> has marked the following task as completed:</p>
        <div style="background: #ECFDF5; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #10B981;">
            <h3 style="margin: 0;">{task_title}</h3>
        </div>
        <p style="color: #6B7280; font-size: 13px;">Log in to your Task Manager to review the completed task.</p>
    </div>
    """
    send_email(creator_email, subject, html_body)
