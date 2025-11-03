import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MasterDataDetailsComponent } from './master-data-details.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { TogglePanelComponent } from './toggle-panel/toggle-panel.component';

describe('MasterDataDetailsComponent', () => {
  let component: MasterDataDetailsComponent;
  let fixture: ComponentFixture<MasterDataDetailsComponent>;
  CommonTestingModule.setUpTestBed(MasterDataDetailsComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MasterDataDetailsComponent, TogglePanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MasterDataDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
