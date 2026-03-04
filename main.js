document.querySelector('.contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var form = this;
    var btn = form.querySelector('button[type="submit"]');
    var origText = btn.textContent;

    // Honeypot check
    if (form.querySelector('[name="bot-field"]').value) return;

    btn.textContent = 'Sending...';
    btn.disabled = true;

    var data = {
        name: form.name.value,
        phone: form.phone.value,
        email: form.email.value,
        service_type: form.service_type.value,
        message: form.message.value
    };

    // Send to serverless proxy (secret stays server-side)
    fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(function(res) {
        if (!res.ok) throw new Error('failed');
        showFormSuccess(form);
    }).catch(function() {
        btn.textContent = origText;
        btn.disabled = false;
        var err = form.querySelector('.form-error');
        if (!err) {
            err = document.createElement('p');
            err.className = 'form-error';
            err.style.cssText = 'text-align:center;color:#ff4444;font-size:14px;margin-top:12px;';
            form.appendChild(err);
        }
        err.textContent = 'Something went wrong. Please call (860) 505-9335 instead.';
    });
});

function showFormSuccess(form) {
    while (form.firstChild) form.removeChild(form.firstChild);
    var wrap = document.createElement('div');
    wrap.style.cssText = 'text-align:center;padding:60px 20px;';
    var check = document.createElement('div');
    check.style.cssText = 'font-size:48px;margin-bottom:16px;';
    check.textContent = '\u2713';
    var h = document.createElement('h3');
    h.style.cssText = 'color:var(--gold);margin-bottom:12px;';
    h.textContent = 'Request Received!';
    var p1 = document.createElement('p');
    p1.style.cssText = 'color:var(--light);font-size:16px;';
    p1.textContent = 'A team member will contact you shortly.';
    var p2 = document.createElement('p');
    p2.style.cssText = 'color:var(--gray);font-size:14px;margin-top:12px;';
    p2.textContent = 'For emergencies, call ';
    var a = document.createElement('a');
    a.href = 'tel:+18605059335';
    a.style.color = 'var(--gold)';
    a.textContent = '(860) 505-9335';
    p2.appendChild(a);
    p2.appendChild(document.createTextNode(' now.'));
    wrap.appendChild(check);
    wrap.appendChild(h);
    wrap.appendChild(p1);
    wrap.appendChild(p2);
    form.appendChild(wrap);
}

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(function(q) {
    q.addEventListener('click', function() {
        this.parentElement.classList.toggle('active');
    });
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});
