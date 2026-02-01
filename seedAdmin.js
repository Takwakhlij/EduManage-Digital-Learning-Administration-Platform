import fetch from 'node-fetch';

const adminUser = {
    firstName: 'Admin',
    lastName: 'Principal',
    email: 'admin@gmail.com',
    password: 'password123',
    confirmPassword: 'password123',
    role: 'admin',
    ageGroup: '36-50',
    currentLevel: 'advanced',
    interestedProgram: 'islamic-studies'
};

const registerAdmin = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(adminUser),
        });

        const data = await response.json();

        if (response.ok) {
            console.log('SUCCESS: Admin user created successfully!');
            console.log('Email:', adminUser.email);
            console.log('Password:', adminUser.password);
        } else {
            console.log('INFO: Could not create admin (maybe already exists)');
            console.log('Message:', data.message);
        }
    } catch (error) {
        console.error('ERROR: Failed to connect to server', error.message);
    }
};

registerAdmin();
