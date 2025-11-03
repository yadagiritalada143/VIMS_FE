import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalStorageDataComponent } from './local-storage-data.component';

describe('LocalStorageDataComponent', () => {
  let component: LocalStorageDataComponent;
  let fixture: ComponentFixture<LocalStorageDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LocalStorageDataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LocalStorageDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
