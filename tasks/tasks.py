# Refactored task function
import glob
import os
import queue
import threading
import traceback
from pathlib import Path

from firebase_crud import update_status, uploadFileReturnUrl, addUrlTodocument

from test_api_v2 import runScriptLocally

def remove_folder(folder_name):
    ''''''
    for file in glob.glob(folder_name + "/*"):
        os.remove(file)
    q = Path(folder_name)
    q.rmdir()

    # file_path = os.getcwd() + "/assets/" + file_name + '.pdf'
    # os.remove(file_path)
    # for ctr in range(0,len(list_of_ops)):
    #     file_path = os.getcwd() + '/assets/'+file_name+f'barchart{ctr+1}.png'
    #     os.remove(file_path)


def generate_reports_task(payload):
    try:
        # Step 1: Initial status update
        update_status(0.11, payload.meta_data.sim_id)
        timestamp = runScriptLocally(payload)

        # Step 2: Define file paths
        free_report_file_path = os.path.join(os.getcwd(), "assets", timestamp, 'free_report.pdf')
        full_report_file_path = os.path.join(os.getcwd(), "assets", timestamp, 'full_report.pdf')

        # Step 3: Prepare Firebase paths and queues
        free_report_file_path_firebase = queue.Queue()
        full_report_file_path_firebase = queue.Queue()

        # Step 4: Update status and start threads for upload
        update_status(0.83, payload.meta_data.sim_id)
        thread1 = threading.Thread(target=uploadFileReturnUrl,
                                   args=(payload, 'free', free_report_file_path, free_report_file_path_firebase))
        thread2 = threading.Thread(target=uploadFileReturnUrl,
                                   args=(payload, 'paid', full_report_file_path, full_report_file_path_firebase))

        thread1.start()
        update_status(0.85, payload.meta_data.sim_id)
        thread2.start()
        update_status(0.90, payload.meta_data.sim_id)

        # Step 5: Wait for threads to finish
        thread1.join()
        thread2.join()

        # Step 6: Retrieve URLs from queues
        free_report_url = free_report_file_path_firebase.get()
        full_report_url = full_report_file_path_firebase.get()

        # Step 7: Update database with URLs
        addUrlTodocument("paidReportUrl", payload.meta_data.sim_id, full_report_url)
        addUrlTodocument("reportUrl", payload.meta_data.sim_id, free_report_url)

        # Step 8: Clean up generated files
        remove_folder(os.path.join(os.getcwd(), "assets", timestamp))

        # Final status update
        update_status(1.0, payload.meta_data.sim_id)

    except Exception:
        print(traceback.format_exc())
        update_status(-1.0, payload.meta_data.sim_id)
