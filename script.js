
        const response = await fetch(
          "/api/admissions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error ||
            data.message ||
            "Admission submission failed"
          );
        }

        siteState = data;

        renderDynamicContent();
        admissionForm.reset();

        if (status) {
          status.textContent =
            "Admission enquiry submitted successfully.";

          status.style.color = "#2e9d63";
        }
      } catch (error) {
        if (status) {
          status.textContent =
            error.message ||
            "Submission failed. Please try again.";

          status.style.color = "#d94c4c";
        }
      }
    }
  );
}
