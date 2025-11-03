import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { RemoteWorkerDetailsViewComponent } from './remote-worker-details-view.component';

describe('RemoteWorkerDetailsViewComponent', () => {
  let component: RemoteWorkerDetailsViewComponent;
  let fixture: ComponentFixture<RemoteWorkerDetailsViewComponent>;
  CommonTestingModule.setUpTestBed(RemoteWorkerDetailsViewComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RemoteWorkerDetailsViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoteWorkerDetailsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
